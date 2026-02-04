# 80-SAFETY-MODULE-SPEC.md
# EXHAUSTIVE SAFETY MODULE SPECIFICATION
## AlroWare / SteelWise Multi-Branch EHS Platform

**Version:** 1.0.0  
**Status:** Implementation-Ready  
**Classification:** Internal Use Only  
**Effective Date:** 2026-02-03  
**Owner:** EHS Systems Architecture Team

---

# TABLE OF CONTENTS

- [A) Safety Program Overview](#a-safety-program-overview)
- [B) Standards & Controls Map](#b-standards--controls-map)
- [C) Safety Data Model](#c-safety-data-model)
- [D) Workflows (State Machines)](#d-workflows-state-machines)
- [E) UI/UX (Material UI) + Task Lenses](#e-uiux-material-ui--task-lenses)
- [F) Roles & Permissions](#f-roles--permissions)
- [G) AI Safety Assistant](#g-ai-safety-assistant-rag--tools--guardrails)
- [H) APIs (Endpoint List)](#h-apis-endpoint-list)
- [I) Eventing + Audit + Evidence](#i-eventing--audit--evidence)
- [J) KPIs + Reports](#j-kpis--reports)
- [K) Testing Plan](#k-testing-plan)
- [L) Rollout Plan + Go/No-Go](#l-rollout-plan--gono-go)

---

================================================================================
# A) SAFETY PROGRAM OVERVIEW
================================================================================

## A.1 Module Purpose

The **Safety Module** is a comprehensive Environmental Health & Safety (EHS) management system designed specifically for multi-branch metals and plastics service centers. It integrates directly with production operations, dispatch, maintenance, and workforce management to create a closed-loop safety ecosystem.

## A.2 Core Objectives

### A.2.1 Injury Prevention
- **Hazard Identification**: Systematic capture and risk-ranking of workplace hazards
- **Job Hazard Analysis (JHA/JSA)**: Task-specific hazard controls before work begins
- **Permit-to-Work Systems**: Controlled authorization for high-risk activities (LOTO, hot work, confined space, electrical)
- **Pre-Task Verification**: Equipment inspections, PPE checks, competency validation

### A.2.2 Risk Reduction
- **Hierarchy of Controls**: Engineering > Administrative > PPE tracking for each hazard
- **Leading Indicators**: Proactive metrics (inspections, observations, near-misses) drive intervention before incidents
- **Equipment Safety**: Asset lifecycle management with mandatory safety checks
- **Contractor/Visitor Safety**: Controlled access with acknowledgement and orientation requirements

### A.2.3 Safe Work Practice Enforcement
- **Policy Governance**: Version-controlled policies with mandatory acknowledgement
- **Training Management**: Role-based, location-scoped, work-center-specific training requirements
- **Competency Verification**: Assessments, certifications, and recertification tracking
- **Behavioral Safety**: Observation programs to reinforce safe behaviors

### A.2.4 Compliance Proof (Auditable Records)
- **Immutable Audit Trail**: Every action logged with actor, timestamp, before/after state
- **Electronic Signatures**: 21 CFR Part 11-style signoffs for permits, inspections, policy acknowledgements
- **Evidence Packages**: Photos, PDFs, checklists automatically compiled per incident/permit/audit
- **Retention Management**: Configurable retention policies aligned with regulatory requirements

### A.2.5 Safety Culture Loop
- **Near-Miss Reporting**: Anonymous or attributed reporting with positive recognition
- **Safety Observations**: Behavior-based safety (BBS) programs with coaching
- **Toolbox Talks**: Pre-shift safety communications with attendance tracking
- **Stop Work Authority**: Empowered workforce with documented SWA events
- **Recognition Programs**: Integration with positive safety performance tracking

### A.2.6 Production Integration
- **Dispatch Integration**: Safety blocks prevent job dispatch to unsafe conditions
- **Work Center Status**: Real-time equipment safety status affects scheduling
- **Maintenance Coordination**: Safety defects trigger maintenance workflows
- **Inventory/SDS Integration**: Material safety data linked to storage locations
- **Operator Qualification**: Training/certification status gates machine operation

## A.3 Covered Hazard Categories

| Hazard Category | Typical Operations | Control Systems |
|----------------|-------------------|-----------------|
| Hazardous Energy / LOTO | Saws, shears, routers, conveyors | LOTO Permits, Machine-specific procedures |
| Powered Industrial Trucks | Forklifts, order pickers, pallet jacks | Daily inspections, operator certification |
| Cranes & Rigging | Overhead cranes, jib cranes, chain hoists | Monthly inspections, rigging inspections, lift plans |
| Hot Work | Welding, cutting, grinding | Hot work permits, fire watch |
| Machine Guarding | Saws, shears, routers, press brakes | Guard inspections, interlock verification |
| Electrical Safety | Panel work, equipment installation | Electrical work permits, arc flash PPE |
| Chemical/SDS | Cutting fluids, coatings, cleaning agents | SDS library, exposure monitoring, PPE matrix |
| Ergonomics | Material handling, repetitive tasks | JHA ergonomic controls, lift equipment |
| Slips/Trips/Falls | Aisles, platforms, loading docks | Housekeeping inspections, fall protection |
| Confined Spaces | Tanks, pits (if applicable) | Confined space permits, atmospheric monitoring |
| Contractor Safety | Vendor work, installations, repairs | Contractor pre-qualification, site orientation |

## A.4 Module Boundaries

### In Scope
- Safety policy and procedure management
- Training and competency management
- Inspections and checklists
- Permit-to-work systems
- Incident management and investigation
- Corrective/Preventive Actions (CAPA)
- Audit management
- Equipment safety tracking
- SDS/chemical management
- Safety KPIs and reporting
- AI-assisted safety operations
- Mobile/kiosk interfaces for floor operations

### Out of Scope (Interfaces Only)
- Industrial hygiene sampling (import results)
- Workers' compensation claims (export incident data)
- Environmental permits (separate module)
- Medical surveillance (import certifications)
- Security access control (interface for contractor badges)

## A.5 Disclaimer

> **IMPORTANT**: This Safety Module provides program management tools and best-practice controls. It does NOT constitute legal advice. Organizations must consult qualified EHS professionals and legal counsel to ensure regulatory compliance. The system supports compliance programs but does not guarantee regulatory compliance.

---

================================================================================
# B) STANDARDS & CONTROLS MAP
================================================================================

## B.1 Primary Regulatory Standards

### B.1.1 OSHA 29 CFR 1910.147 — Control of Hazardous Energy (LOTO)

| Requirement | Module Feature | Records | Approvals | Training | Audit Frequency | Evidence Package |
|-------------|---------------|---------|-----------|----------|-----------------|------------------|
| Written LOTO program | PolicyDocument (type: LOTO_PROGRAM) | Version history, approval chain | EHS Director publish | Annual awareness + equipment-specific | Annual program review | Policy PDF, signoff roster |
| Machine-specific procedures | EquipmentLotoProc entity linked to EquipmentAsset | Procedure revision history | EHS + Maintenance Lead | Equipment-specific before use | With each procedure change | Procedure doc, training records |
| Authorized employee training | TrainingCourse (LOTO_AUTHORIZED) | TrainingCompletion, Quiz results | Trainer sign-off | Initial + annual refresher | Annual verification | Certificate, quiz score, signoff |
| Affected employee training | TrainingCourse (LOTO_AFFECTED) | TrainingCompletion | Trainer sign-off | Initial + annual refresher | Annual verification | Attendance record |
| Periodic inspections | Inspection (type: LOTO_PERIODIC) | Inspection record, defects | EHS Specialist | N/A | Annual per procedure | Inspection form, observer notes |
| Energy isolation verification | LotoPermit with verification steps | Permit record, try-start log | Authorized employee | Per procedure | Each use | Permit, lock tags, try-start record |
| Group LOTO provisions | LotoPermit (mode: GROUP) | All participant signoffs | Lead authorized employee | Group LOTO training | Each use | Participant roster, signoffs |
| Lock/Tag hardware | Asset tracking for locks/tags | Issuance log | Supervisor | Initial training | Annual inventory | Lock assignment register |

### B.1.2 OSHA 29 CFR 1910.178 — Powered Industrial Trucks (Forklifts)

| Requirement | Module Feature | Records | Approvals | Training | Audit Frequency | Evidence Package |
|-------------|---------------|---------|-----------|----------|-----------------|------------------|
| Operator training | TrainingCourse (FORKLIFT_OPERATOR) | TrainingCompletion, practical eval | Trainer certification | Initial + 3-year refresher + incident-triggered | 3-year cycle | Certificate, eval form, video |
| Daily pre-shift inspection | Inspection (type: FORKLIFT_DAILY) | Checklist, defect log | Operator self-cert | Initial training | Daily compliance review | Checklist, defect photos |
| Defect reporting | InspectionDefect -> CorrectiveAction | Defect record, repair order | Maintenance Lead | N/A | Real-time | Defect photo, repair record |
| Out-of-service tagging | EquipmentAsset.status = OUT_OF_SERVICE | Status change log | Maintenance Lead | N/A | Each occurrence | Tag photo, lockout record |
| Pedestrian safety | TrainingCourse (PEDESTRIAN_FORKLIFT) | TrainingCompletion | Trainer sign-off | Initial orientation | Annual | Attendance record |
| Seatbelt use | SafetyObservation checks | Observation records | N/A | Training reminder | Ongoing | Observation logs |
| Refresher triggers | Incident -> auto TrainingAssignment | Training reassignment record | Supervisor | Per event | N/A | Incident link, training completion |

### B.1.3 NFPA 70E — Electrical Safety in the Workplace

| Requirement | Module Feature | Records | Approvals | Training | Audit Frequency | Evidence Package |
|-------------|---------------|---------|-----------|----------|-----------------|------------------|
| Electrical safety program | PolicyDocument (type: ELECTRICAL_SAFETY) | Version history | EHS Director | Annual awareness | Annual | Policy PDF, signoffs |
| Arc flash hazard analysis | EquipmentAsset.arcFlashData | Label data, incident energy | Qualified person | Before work | Per NFPA 70E table | Analysis report, labels |
| PPE selection tables | PPERequirementMatrix (electrical) | Matrix revision history | EHS | Initial + changes | Annual review | Matrix PDF |
| Electrical work permits | ElectricalWorkPermit | Permit record, scope | Qualified electrical worker + Supervisor | Task-specific | Each job | Permit, LOTO proof |
| Energized work justification | ElectricalWorkPermit.justification | Justification record | EHS Manager + Supervisor | Energized work training | Each occurrence | Written justification, approval |
| Training (qualified/unqualified) | TrainingCourse (NFPA_70E_QUALIFIED) | TrainingCompletion | Trainer | Initial + 3-year | 3-year cycle | Certificate, quiz |
| Incident investigation | Incident (type: ELECTRICAL) | Investigation, root cause | EHS Manager | N/A | Each occurrence | Investigation report, photos |

### B.1.4 ANSI/ASSP Z244.1 — Control of Hazardous Energy (LOTO + Alternatives)

| Requirement | Module Feature | Records | Approvals | Training | Audit Frequency | Evidence Package |
|-------------|---------------|---------|-----------|----------|-----------------|------------------|
| Risk assessment for energy control | JHA with energy control section | JHA record | EHS Specialist | JHA training | Per task | JHA form, risk matrix |
| Alternative methods (control reliable) | Permit (type: ALTERNATIVE_LOTO) | Method validation, safeguards | EHS Manager | Alternative methods training | Per procedure | Validation record, safeguard proof |
| Hierarchy of control preference | System enforces LOTO preference | Decision log | EHS | Initial training | Per permit | Hierarchy decision record |
| Verification methods | LotoPermit.verificationSteps | Try-start records | Authorized employee | Verification training | Each use | Verification checklist |

## B.2 Best Practice Program Elements

### B.2.1 Machine Guarding

| Element | Module Feature | Records | Approvals | Training | Audit Frequency |
|---------|---------------|---------|-----------|----------|-----------------|
| Guard inventory | EquipmentAsset.guards[] | Guard registry | Maintenance | Initial orientation | Annual inventory |
| Guard inspections | Inspection (type: MACHINE_GUARDING) | Checklist, defects | Supervisor | Guard awareness | Weekly per machine |
| Interlock verification | Inspection (type: INTERLOCK_CHECK) | Test records | Maintenance | Interlock training | Monthly |
| Missing guard reporting | InspectionDefect (severity: CRITICAL) | Defect, CAPA | Immediate notification | N/A | Real-time |
| Guard bypass control | Permit (type: GUARD_BYPASS) | Bypass justification | EHS Manager | Bypass procedures | Each occurrence |

### B.2.2 Hot Work Program

| Element | Module Feature | Records | Approvals | Training | Audit Frequency |
|---------|---------------|---------|-----------|----------|-----------------|
| Hot work program | PolicyDocument (type: HOT_WORK) | Policy history | EHS Director | Annual awareness | Annual |
| Hot work permits | HotWorkPermit | Permit, fire watch | Supervisor + EHS | Hot work training | Each job |
| Fire watch requirements | HotWorkPermit.fireWatch | Fire watch log | Fire watch trained person | Fire watch training | Each permit |
| Post-work monitoring | HotWorkPermit.postWorkCheck | Monitoring log | Fire watch | Training | 30-60 min post-work |
| Area inspection | HotWorkPermit.areaChecklist | Checklist | Permit issuer | Initial training | Each permit |

### B.2.3 Crane & Rigging Safety

| Element | Module Feature | Records | Approvals | Training | Audit Frequency |
|---------|---------------|---------|-----------|----------|-----------------|
| Crane inspection | Inspection (type: CRANE_MONTHLY) | Checklist, defects | Qualified inspector | Crane operator | Monthly |
| Rigging inspection | Inspection (type: RIGGING) | Sling/hardware check | Rigger | Rigging awareness | Before each use |
| Critical lift planning | Permit (type: CRITICAL_LIFT) | Lift plan | Crane Supervisor + EHS | Critical lift training | Each critical lift |
| Operator certification | TrainingCourse (CRANE_OPERATOR) | Certification records | Trainer | Initial + recert | Per OSHA/ASME |
| Load rating compliance | EquipmentAsset.loadCapacity | Rating verification | Maintenance | Training | Annual |

### B.2.4 PPE Program

| Element | Module Feature | Records | Approvals | Training | Audit Frequency |
|---------|---------------|---------|-----------|----------|-----------------|
| Hazard assessment | JHA PPE section | Assessment record | EHS Specialist | JHA training | Per task |
| PPE matrix | PPERequirementMatrix | Matrix by area/task | EHS Manager | PPE training | Annual review |
| PPE training | TrainingCourse (PPE_GENERAL) | Training records | Trainer | Initial + refresher | Annual |
| PPE inspections | SafetyObservation (type: PPE_CHECK) | Observation records | Supervisor | Observer training | Ongoing |
| Specialty PPE fit | TrainingCompletion (type: FIT_TEST) | Fit test records | Qualified tester | Respirator training | Annual (resp) |

### B.2.5 Hazard Communication / SDS

| Element | Module Feature | Records | Approvals | Training | Audit Frequency |
|---------|---------------|---------|-----------|----------|-----------------|
| Written HazCom program | PolicyDocument (type: HAZCOM) | Policy history | EHS Director | Annual | Annual |
| SDS library | SDSLibrary | SDS records, revisions | EHS Specialist | HazCom training | Real-time updates |
| Container labeling | Inspection (type: CONTAINER_LABEL) | Label check records | Supervisor | HazCom training | Monthly |
| HazCom training | TrainingCourse (HAZCOM) | Training records | Trainer | Initial + annual | Annual |
| Chemical inventory | SDSLibrary.inventory | Inventory records | EHS | Initial training | Annual reconciliation |

### B.2.6 Emergency Action Plan

| Element | Module Feature | Records | Approvals | Training | Audit Frequency |
|---------|---------------|---------|-----------|----------|-----------------|
| Written EAP | PolicyDocument (type: EAP) | Policy history | EHS Director | Initial + changes | Annual |
| Emergency drills | Inspection (type: EMERGENCY_DRILL) | Drill records, timing | EHS Manager | Drill training | Quarterly+ |
| Evacuation routes | PolicyDocument attachments | Posted maps | Facility Manager | Orientation | Annual review |
| Emergency contacts | SystemConfiguration | Contact list | EHS Manager | Orientation | Monthly verification |
| First aid/AED | Inspection (type: FIRST_AID_STATION) | Inspection records | First aid trained | First aid training | Monthly |

### B.2.7 Incident Investigation

| Element | Module Feature | Records | Approvals | Training | Audit Frequency |
|---------|---------------|---------|-----------|----------|-----------------|
| Investigation procedures | PolicyDocument (type: INCIDENT_INVESTIGATION) | Policy history | EHS Director | Investigation training | Annual |
| Incident reporting | Incident entity | Incident records | Supervisor | Awareness training | Real-time |
| Root cause analysis | Incident.rootCauseAnalysis | RCA documentation | EHS Specialist | RCA training | Per incident |
| Corrective actions | CorrectiveAction entity | CAPA records | EHS Manager | CAPA training | Per incident |
| OSHA recordkeeping | Incident.oshaClassification | 300 log, 301 forms | EHS Director | Recordkeeping training | Per incident + annual |

### B.2.8 Inspections & Audits

| Element | Module Feature | Records | Approvals | Training | Audit Frequency |
|---------|---------------|---------|-----------|----------|-----------------|
| Inspection schedules | InspectionSchedule | Schedule records | EHS Manager | Inspector training | Per schedule |
| Findings management | InspectionDefect -> CorrectiveAction | Defect, CAPA | Supervisor | N/A | Real-time |
| Internal audits | Audit (type: INTERNAL) | Audit records | EHS Director | Auditor training | Annual+ |
| External audits | Audit (type: EXTERNAL) | Audit records | EHS Director | N/A | Per schedule |
| Management review | SafetyKPIRecord | Review records | Branch Manager | Leadership training | Quarterly |

---

================================================================================
# C) SAFETY DATA MODEL
================================================================================

## C.1 Entity Relationship Diagram (Textual)

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  PolicyDocument │◄──────│ PolicyApproval  │──────►│      User       │
│                 │       │                 │       │                 │
│ - versions[]    │       │ - signoff       │       │ - roles[]       │
│ - effectiveDate │       │ - timestamp     │       │ - locations[]   │
│ - type          │       │ - decision      │       │ - certifications│
└────────┬────────┘       └─────────────────┘       └────────┬────────┘
         │                                                   │
         │ acknowledges                                      │
         ▼                                                   │
┌─────────────────┐                                         │
│ AcknowledgeSign │◄────────────────────────────────────────┘
│                 │
│ - userId        │
│ - policyId      │
│ - signedAt      │
│ - signature     │
└─────────────────┘

┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ TrainingCourse  │◄──────│TrainingAssign   │──────►│      User       │
│                 │       │                 │       │                 │
│ - curriculum    │       │ - dueDate       │       │                 │
│ - duration      │       │ - status        │       │                 │
│ - assessment    │       │ - reminderSent  │       │                 │
└────────┬────────┘       └────────┬────────┘       └─────────────────┘
         │                         │
         │                         ▼
         │                ┌─────────────────┐
         │                │TrainingComplete │
         │                │                 │
         │                │ - completedAt   │
         │                │ - quizScore     │
         │                │ - certificate   │
         │                │ - signature     │
         │                └─────────────────┘
         │
         ▼
┌─────────────────┐
│   Assessment    │
│                 │
│ - questions[]   │
│ - passingScore  │
│ - attempts      │
└─────────────────┘

┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ EquipmentAsset  │◄──────│   Inspection    │──────►│      User       │
│                 │       │                 │       │   (inspector)   │
│ - serialNumber  │       │ - type          │       │                 │
│ - safetyStatus  │       │ - status        │       │                 │
│ - lotoProcedure │       │ - checklist     │       │                 │
│ - arcFlashData  │       │ - defects[]     │       │                 │
└────────┬────────┘       └────────┬────────┘       └─────────────────┘
         │                         │
         │                         ▼
         │                ┌─────────────────┐
         │                │InspectionDefect │
         │                │                 │
         │                │ - severity      │
         │                │ - description   │
         │                │ - photos[]      │
         │                │ - capaId        │
         │                └────────┬────────┘
         │                         │
         │                         ▼
         │                ┌─────────────────┐
         └───────────────►│ CorrectiveAction│
                          │                 │
                          │ - type          │
                          │ - status        │
                          │ - verification  │
                          │ - dueDate       │
                          └─────────────────┘

┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     Permit      │◄──────│  PermitSignoff  │──────►│      User       │
│                 │       │                 │       │                 │
│ - type          │       │ - role          │       │                 │
│ - status        │       │ - signedAt      │       │                 │
│ - jhaId         │       │ - signature     │       │                 │
│ - workCenterId  │       │ - section       │       │                 │
│ - validFrom/To  │       └─────────────────┘       └─────────────────┘
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│JobHazardAnalysis│
│                 │
│ - hazards[]     │
│ - controls[]    │
│ - ppeRequired[] │
│ - signatures[]  │
└─────────────────┘

┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    Incident     │◄──────│IncidentInvest   │──────►│      User       │
│                 │       │                 │       │  (investigator) │
│ - type          │       │ - rootCause     │       │                 │
│ - severity      │       │ - fiveWhys      │       │                 │
│ - status        │       │ - fishbone      │       │                 │
│ - location      │       │ - findings[]    │       │                 │
│ - witnesses[]   │       └────────┬────────┘       └─────────────────┘
│ - oshaRecordable│                │
└────────┬────────┘                │
         │                         ▼
         │                ┌─────────────────┐
         └───────────────►│CorrectiveAction │
                          │                 │
                          │ - incidentId    │
                          │ - findingId     │
                          └─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│     Audit       │◄──────│  AuditFinding   │
│                 │       │                 │
│ - type          │       │ - category      │
│ - scope         │       │ - severity      │
│ - auditDate     │       │ - description   │
│ - auditor       │       │ - capaId        │
│ - status        │       │ - evidence[]    │
└─────────────────┘       └─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│   SDSLibrary    │◄──────│   SDSRevision   │
│                 │       │                 │
│ - productName   │       │ - version       │
│ - manufacturer  │       │ - effectiveDate │
│ - hazards[]     │       │ - pdfUrl        │
│ - location      │       │ - supersededBy  │
└─────────────────┘       └─────────────────┘

┌─────────────────┐
│SafetyObservation│
│                 │
│ - type          │
│ - observerId    │
│ - locationId    │
│ - behavior      │
│ - safeUnsafe    │
│ - coaching      │
└─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│  SafetyMeeting  │◄──────│MeetingAttendee  │
│                 │       │                 │
│ - type          │       │ - userId        │
│ - topic         │       │ - signedAt      │
│ - presenter     │       │ - signature     │
│ - date          │       └─────────────────┘
│ - locationId    │
└─────────────────┘

┌─────────────────┐
│ StopWorkEvent   │
│                 │
│ - issuedBy      │
│ - reason        │
│ - status        │
│ - resolution    │
│ - resumeAuth    │
└─────────────────┘
```

## C.2 Detailed Entity Definitions

### C.2.1 PolicyDocument

```typescript
interface PolicyDocument {
  id: string;                    // UUID, PK
  tenantId: string;              // FK -> Tenant
  locationId?: string;           // FK -> Location (null = all locations)
  code: string;                  // e.g., "EHS-LOTO-001"
  title: string;
  type: PolicyType;              // LOTO_PROGRAM, HOT_WORK, ELECTRICAL_SAFETY, etc.
  category: PolicyCategory;      // PROGRAM, PROCEDURE, WORK_INSTRUCTION, FORM
  status: PolicyStatus;          // DRAFT, PENDING_APPROVAL, APPROVED, PUBLISHED, ARCHIVED
  currentVersion: number;
  effectiveDate: DateTime;
  nextReviewDate: DateTime;
  reviewFrequencyMonths: number;
  ownerId: string;               // FK -> User
  contentUrl: string;            // S3/storage URL
  contentHash: string;           // SHA-256 for integrity
  requiresAcknowledgement: boolean;
  acknowledgementScope: AckScope; // ALL_EMPLOYEES, BY_ROLE, BY_LOCATION, BY_WORKCENTER
  acknowledgementRoles?: string[];
  acknowledgementLocations?: string[];
  acknowledgementDueDays: number;
  supersededById?: string;       // FK -> PolicyDocument (for version chain)
  createdAt: DateTime;
  updatedAt: DateTime;
  publishedAt?: DateTime;
  archivedAt?: DateTime;
  
  // Relations
  versions: PolicyVersion[];
  approvals: PolicyApproval[];
  acknowledgements: PolicyAcknowledgement[];
  auditEvents: AuditEvent[];
}

enum PolicyType {
  LOTO_PROGRAM = 'LOTO_PROGRAM',
  HOT_WORK = 'HOT_WORK',
  ELECTRICAL_SAFETY = 'ELECTRICAL_SAFETY',
  FORKLIFT = 'FORKLIFT',
  CRANE_RIGGING = 'CRANE_RIGGING',
  MACHINE_GUARDING = 'MACHINE_GUARDING',
  PPE = 'PPE',
  HAZCOM = 'HAZCOM',
  EMERGENCY_ACTION = 'EMERGENCY_ACTION',
  INCIDENT_INVESTIGATION = 'INCIDENT_INVESTIGATION',
  CONTRACTOR_SAFETY = 'CONTRACTOR_SAFETY',
  CONFINED_SPACE = 'CONFINED_SPACE',
  FALL_PROTECTION = 'FALL_PROTECTION',
  ERGONOMICS = 'ERGONOMICS',
  GENERAL_SAFETY = 'GENERAL_SAFETY'
}

enum PolicyStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED'
}
```

### C.2.2 TrainingCourse, TrainingAssignment, TrainingCompletion

```typescript
interface TrainingCourse {
  id: string;                    // UUID, PK
  tenantId: string;              // FK -> Tenant
  code: string;                  // e.g., "TRN-LOTO-001"
  title: string;
  description: string;
  type: TrainingType;
  category: TrainingCategory;
  deliveryMethod: DeliveryMethod; // ONLINE, INSTRUCTOR_LED, BLENDED, OJT
  durationMinutes: number;
  contentUrl?: string;           // LMS link or video URL
  passingScore?: number;         // If assessment required
  validityMonths?: number;       // Recertification period (null = one-time)
  isActive: boolean;
  requiresPracticalEval: boolean;
  practicalEvalFormId?: string;  // FK -> InspectionTemplate
  prerequisites?: string[];      // FK -> TrainingCourse[]
  applicableRoles: string[];     // UserRole[] that require this training
  applicableWorkCenters?: string[]; // WorkCenter[] that trigger requirement
  applicableEquipment?: string[]; // EquipmentType[] that require this
  version: number;
  createdAt: DateTime;
  updatedAt: DateTime;
  createdById: string;           // FK -> User
  
  // Relations
  assignments: TrainingAssignment[];
  assessments: TrainingAssessment[];
}

interface TrainingAssignment {
  id: string;                    // UUID, PK
  tenantId: string;              // FK -> Tenant
  courseId: string;              // FK -> TrainingCourse
  userId: string;                // FK -> User
  assignedById: string;          // FK -> User
  assignedAt: DateTime;
  dueDate: DateTime;
  status: TrainingAssignmentStatus;
  priority: Priority;
  triggerType: TrainingTriggerType; // NEW_HIRE, ROLE_CHANGE, RECERTIFICATION, INCIDENT, MANUAL
  triggerSourceId?: string;      // FK to incident, role change, etc.
  remindersSent: number;
  lastReminderAt?: DateTime;
  escalatedAt?: DateTime;
  escalationLevel: number;
  
  // Relations
  course: TrainingCourse;
  user: User;
  completion?: TrainingCompletion;
}

interface TrainingCompletion {
  id: string;                    // UUID, PK
  tenantId: string;              // FK -> Tenant
  assignmentId: string;          // FK -> TrainingAssignment (unique)
  userId: string;                // FK -> User
  courseId: string;              // FK -> TrainingCourse
  completedAt: DateTime;
  expiresAt?: DateTime;          // Calculated from course.validityMonths
  quizScore?: number;
  quizPassed: boolean;
  practicalEvalPassed?: boolean;
  practicalEvaluatorId?: string; // FK -> User
  practicalEvalDate?: DateTime;
  practicalEvalNotes?: string;
  certificateUrl?: string;       // Generated PDF
  signature: string;             // Electronic signature
  signatureTimestamp: DateTime;
  signatureIp: string;
  verifiedById?: string;         // FK -> User (trainer verification)
  verifiedAt?: DateTime;
  
  // Relations
  assignment: TrainingAssignment;
  course: TrainingCourse;
  user: User;
}

enum TrainingType {
  SAFETY_AWARENESS = 'SAFETY_AWARENESS',
  EQUIPMENT_SPECIFIC = 'EQUIPMENT_SPECIFIC',
  HAZARD_SPECIFIC = 'HAZARD_SPECIFIC',
  REGULATORY_REQUIRED = 'REGULATORY_REQUIRED',
  CERTIFICATION = 'CERTIFICATION',
  REFRESHER = 'REFRESHER',
  INCIDENT_CORRECTIVE = 'INCIDENT_CORRECTIVE'
}

enum TrainingCategory {
  LOTO = 'LOTO',
  FORKLIFT = 'FORKLIFT',
  CRANE_RIGGING = 'CRANE_RIGGING',
  HOT_WORK = 'HOT_WORK',
  ELECTRICAL = 'ELECTRICAL',
  HAZCOM = 'HAZCOM',
  PPE = 'PPE',
  EMERGENCY = 'EMERGENCY',
  ERGONOMICS = 'ERGONOMICS',
  MACHINE_GUARDING = 'MACHINE_GUARDING',
  CONFINED_SPACE = 'CONFINED_SPACE',
  FALL_PROTECTION = 'FALL_PROTECTION',
  FIRST_AID = 'FIRST_AID',
  GENERAL_SAFETY = 'GENERAL_SAFETY'
}

enum TrainingAssignmentStatus {
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING_PRACTICAL = 'PENDING_PRACTICAL',
  COMPLETED = 'COMPLETED',
  OVERDUE = 'OVERDUE',
  ESCALATED = 'ESCALATED',
  WAIVED = 'WAIVED',
  EXPIRED = 'EXPIRED'
}

enum TrainingTriggerType {
  NEW_HIRE = 'NEW_HIRE',
  ROLE_CHANGE = 'ROLE_CHANGE',
  LOCATION_CHANGE = 'LOCATION_CHANGE',
  RECERTIFICATION = 'RECERTIFICATION',
  INCIDENT = 'INCIDENT',
  EQUIPMENT_ASSIGNMENT = 'EQUIPMENT_ASSIGNMENT',
  POLICY_UPDATE = 'POLICY_UPDATE',
  MANUAL = 'MANUAL',
  AUDIT_FINDING = 'AUDIT_FINDING'
}
```

### C.2.3 JobHazardAnalysis (JHA/JSA)

```typescript
interface JobHazardAnalysis {
  id: string;                    // UUID, PK
  tenantId: string;              // FK -> Tenant
  locationId: string;            // FK -> Location
  code: string;                  // e.g., "JHA-2026-0001"
  title: string;
  description: string;
  status: JHAStatus;
  type: JHAType;                 // STANDARD, TASK_SPECIFIC, PERMIT_ATTACHED
  workCenterId?: string;         // FK -> WorkCenter
  equipmentAssetId?: string;     // FK -> EquipmentAsset
  jobOrderId?: string;           // FK -> JobOrder (for task-specific)
  permitId?: string;             // FK -> Permit (if permit-attached)
  
  // Risk assessment
  initialRiskScore: number;      // Before controls
  residualRiskScore: number;     // After controls
  riskMatrix: RiskMatrix;
  
  // Steps
  steps: JHAStep[];
  
  // PPE
  requiredPPE: PPERequirement[];
  
  // Training requirements
  requiredTraining: string[];    // FK -> TrainingCourse[]
  
  // Approvals
  preparedById: string;          // FK -> User
  preparedAt: DateTime;
  reviewedById?: string;         // FK -> User (EHS/Supervisor)
  reviewedAt?: DateTime;
  approvedById?: string;         // FK -> User (EHS Manager)
  approvedAt?: DateTime;
  
  // Versioning
  version: number;
  effectiveDate?: DateTime;
  expirationDate?: DateTime;
  supersededById?: string;       // FK -> JobHazardAnalysis
  
  createdAt: DateTime;
  updatedAt: DateTime;
  
  // Relations
  workCenter?: WorkCenter;
  equipment?: EquipmentAsset;
  permit?: Permit;
  signatures: JHASignature[];
  attachments: Attachment[];
}

interface JHAStep {
  id: string;
  jhaId: string;
  sequenceNumber: number;
  taskDescription: string;
  hazards: JHAHazard[];
  controls: JHAControl[];
}

interface JHAHazard {
  id: string;
  stepId: string;
  description: string;
  hazardType: HazardType;
  severityBefore: number;        // 1-5
  probabilityBefore: number;     // 1-5
  riskScoreBefore: number;       // severity * probability
}

interface JHAControl {
  id: string;
  hazardId: string;
  description: string;
  controlType: ControlType;      // ELIMINATION, SUBSTITUTION, ENGINEERING, ADMINISTRATIVE, PPE
  responsibleParty: string;
  severityAfter: number;
  probabilityAfter: number;
  riskScoreAfter: number;
  verificationMethod?: string;
}

enum JHAStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  REVIEWED = 'REVIEWED',
  APPROVED = 'APPROVED',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  ARCHIVED = 'ARCHIVED'
}

enum HazardType {
  STRUCK_BY = 'STRUCK_BY',
  CAUGHT_IN = 'CAUGHT_IN',
  FALL = 'FALL',
  ELECTRICAL = 'ELECTRICAL',
  CHEMICAL = 'CHEMICAL',
  THERMAL = 'THERMAL',
  ERGONOMIC = 'ERGONOMIC',
  NOISE = 'NOISE',
  RADIATION = 'RADIATION',
  BIOLOGICAL = 'BIOLOGICAL',
  ENERGY_RELEASE = 'ENERGY_RELEASE',
  FIRE = 'FIRE',
  EXPLOSION = 'EXPLOSION'
}

enum ControlType {
  ELIMINATION = 'ELIMINATION',
  SUBSTITUTION = 'SUBSTITUTION',
  ENGINEERING = 'ENGINEERING',
  ADMINISTRATIVE = 'ADMINISTRATIVE',
  PPE = 'PPE'
}
```

### C.2.4 Permit (Base + Specific Types)

```typescript
interface Permit {
  id: string;                    // UUID, PK
  tenantId: string;              // FK -> Tenant
  locationId: string;            // FK -> Location
  permitNumber: string;          // e.g., "HW-2026-0001"
  type: PermitType;
  status: PermitStatus;
  
  // Scope
  workDescription: string;
  workLocationDescription: string;
  workCenterId?: string;         // FK -> WorkCenter
  equipmentAssetIds: string[];   // FK -> EquipmentAsset[]
  jobOrderId?: string;           // FK -> JobOrder
  
  // Timing
  requestedAt: DateTime;
  validFrom?: DateTime;
  validTo?: DateTime;            // Max duration varies by permit type
  actualStartTime?: DateTime;
  actualEndTime?: DateTime;
  
  // Personnel
  requesterId: string;           // FK -> User (permit requester)
  issuerId?: string;             // FK -> User (permit issuer/approver)
  permitHolderId?: string;       // FK -> User (responsible person)
  authorizedWorkers: PermitWorker[];
  
  // Risk assessment
  jhaId?: string;                // FK -> JobHazardAnalysis
  riskLevel: RiskLevel;
  
  // Type-specific data (stored as JSONB)
  typeSpecificData: LotoPermitData | HotWorkPermitData | ElectricalPermitData | ConfinedSpacePermitData;
  
  // Checklists
  preWorkChecklist: ChecklistResponse[];
  postWorkChecklist?: ChecklistResponse[];
  
  // Signoffs
  signoffs: PermitSignoff[];
  
  // Closeout
  closedAt?: DateTime;
  closedById?: string;           // FK -> User
  closeoutNotes?: string;
  
  createdAt: DateTime;
  updatedAt: DateTime;
  
  // Relations
  jha?: JobHazardAnalysis;
  equipment: EquipmentAsset[];
  attachments: Attachment[];
  auditEvents: AuditEvent[];
}

// LOTO-specific data
interface LotoPermitData {
  energySources: EnergySource[];
  isolationPoints: IsolationPoint[];
  verificationSteps: VerificationStep[];
  lockTags: LockTag[];
  groupLotoMode: boolean;
  groupLotoCoordinator?: string; // FK -> User
  tryStartPerformed: boolean;
  tryStartById?: string;
  tryStartAt?: DateTime;
  zerEnergyVerified: boolean;
}

interface EnergySource {
  id: string;
  type: EnergyType;              // ELECTRICAL, PNEUMATIC, HYDRAULIC, MECHANICAL, THERMAL, CHEMICAL, GRAVITATIONAL
  description: string;
  magnitude?: string;
  isolationMethod: string;
}

interface IsolationPoint {
  id: string;
  energySourceId: string;
  location: string;
  device: string;                // Breaker, valve, etc.
  lockRequired: boolean;
  tagRequired: boolean;
  verificationMethod: string;
}

interface LockTag {
  id: string;
  isolationPointId: string;
  lockNumber: string;
  tagNumber: string;
  assignedToId: string;          // FK -> User
  appliedAt?: DateTime;
  removedAt?: DateTime;
}

// Hot Work-specific data
interface HotWorkPermitData {
  hotWorkType: HotWorkType;      // WELDING, CUTTING, GRINDING, BRAZING, SOLDERING
  fireHazardsIdentified: string[];
  firePreventionMeasures: string[];
  fireSuppression: string[];     // Extinguisher types/locations
  fireWatchRequired: boolean;
  fireWatchDurationMinutes: number;
  fireWatchPersonId?: string;    // FK -> User
  fireWatchLog: FireWatchEntry[];
  areaInspected: boolean;
  areaInspectedById?: string;
  combustiblesRemoved: boolean;
  combustiblesCovered: boolean;
  sprinklersActive: boolean;
  detectorsNotified: boolean;
  postWorkMonitoringMinutes: number;
  postWorkMonitoringCompleted: boolean;
  postWorkMonitoringById?: string;
}

// Electrical Work-specific data
interface ElectricalPermitData {
  workType: ElectricalWorkType;  // DE_ENERGIZED, ENERGIZED, TESTING
  voltage: number;
  arcFlashCategory: number;      // 0-4
  arcFlashIncidentEnergy?: number;
  arcFlashBoundary?: number;
  limitedApproachBoundary?: number;
  restrictedApproachBoundary?: number;
  prohibitedApproachBoundary?: number;
  ppeRequired: string[];
  qualifiedPersonId: string;     // FK -> User
  energizedWorkJustification?: string;
  energizedWorkApprovedById?: string;
  testingProcedure?: string;
}

// Confined Space-specific data
interface ConfinedSpacePermitData {
  spaceDescription: string;
  spaceClassification: SpaceClassification; // PERMIT_REQUIRED, NON_PERMIT, RECLASSIFIED
  hazardsIdentified: ConfinedSpaceHazard[];
  atmosphericTesting: AtmosphericReading[];
  testingFrequencyMinutes: number;
  ventilationRequired: boolean;
  ventilationType?: string;
  rescuePlan: string;
  rescueTeamNotified: boolean;
  attendantId: string;           // FK -> User
  entrantIds: string[];          // FK -> User[]
  entrySupervisorId: string;     // FK -> User
  communicationMethod: string;
  emergencyEquipment: string[];
}

enum PermitType {
  LOTO = 'LOTO',
  HOT_WORK = 'HOT_WORK',
  ELECTRICAL = 'ELECTRICAL',
  CONFINED_SPACE = 'CONFINED_SPACE',
  EXCAVATION = 'EXCAVATION',
  CRITICAL_LIFT = 'CRITICAL_LIFT',
  GUARD_BYPASS = 'GUARD_BYPASS',
  LINE_BREAK = 'LINE_BREAK',
  ROOF_ACCESS = 'ROOF_ACCESS',
  SCAFFOLD = 'SCAFFOLD'
}

enum PermitStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  COMPLETED = 'COMPLETED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
}
```

### C.2.5 Inspection

```typescript
interface Inspection {
  id: string;                    // UUID, PK
  tenantId: string;              // FK -> Tenant
  locationId: string;            // FK -> Location
  inspectionNumber: string;      // e.g., "INS-2026-0001"
  type: InspectionType;
  category: InspectionCategory;
  templateId: string;            // FK -> InspectionTemplate
  status: InspectionStatus;
  
  // Scheduling
  scheduledDate: DateTime;
  scheduledById?: string;        // FK -> User
  scheduleRecurrenceId?: string; // FK -> InspectionSchedule
  
  // Target
  workCenterId?: string;         // FK -> WorkCenter
  equipmentAssetId?: string;     // FK -> EquipmentAsset
  areaDescription?: string;
  
  // Execution
  inspectorId: string;           // FK -> User
  startedAt?: DateTime;
  completedAt?: DateTime;
  durationMinutes?: number;
  
  // Results
  overallResult: InspectionResult; // PASS, FAIL, PASS_WITH_DEFECTS
  score?: number;                // Percentage score if scored
  responses: InspectionResponse[];
  defects: InspectionDefect[];
  
  // Signoff
  inspectorSignature?: string;
  inspectorSignedAt?: DateTime;
  supervisorReviewerId?: string;
  supervisorReviewedAt?: DateTime;
  supervisorNotes?: string;
  
  createdAt: DateTime;
  updatedAt: DateTime;
  
  // Relations
  template: InspectionTemplate;
  equipment?: EquipmentAsset;
  workCenter?: WorkCenter;
  attachments: Attachment[];
}

interface InspectionTemplate {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  type: InspectionType;
  category: InspectionCategory;
  version: number;
  isActive: boolean;
  sections: InspectionSection[];
  scoringMethod?: ScoringMethod;
  passingScore?: number;
  estimatedDurationMinutes: number;
  requiredFrequency: Frequency;
  applicableEquipmentTypes?: string[];
  applicableWorkCenters?: string[];
  regulatoryReference?: string;
  createdAt: DateTime;
  updatedAt: DateTime;
}

interface InspectionSection {
  id: string;
  templateId: string;
  title: string;
  sequenceNumber: number;
  isRequired: boolean;
  questions: InspectionQuestion[];
}

interface InspectionQuestion {
  id: string;
  sectionId: string;
  sequenceNumber: number;
  text: string;
  helpText?: string;
  responseType: ResponseType;    // YES_NO, YES_NO_NA, NUMERIC, TEXT, PHOTO, MULTI_SELECT, SINGLE_SELECT
  options?: string[];            // For select types
  isRequired: boolean;
  isCritical: boolean;           // Fail answer = critical defect
  expectedAnswer?: string;       // For pass/fail determination
  minValue?: number;
  maxValue?: number;
  requiresPhotoOnFail: boolean;
  requiresCommentOnFail: boolean;
  triggersCapa: boolean;
  weight?: number;               // For scoring
}

interface InspectionDefect {
  id: string;
  inspectionId: string;
  questionId: string;
  severity: DefectSeverity;      // CRITICAL, MAJOR, MINOR, OBSERVATION
  description: string;
  immediateAction?: string;
  photos: string[];              // Attachment URLs
  capaId?: string;               // FK -> CorrectiveAction
  resolvedAt?: DateTime;
  resolvedById?: string;
  resolutionNotes?: string;
}

enum InspectionType {
  EQUIPMENT_DAILY = 'EQUIPMENT_DAILY',
  EQUIPMENT_WEEKLY = 'EQUIPMENT_WEEKLY',
  EQUIPMENT_MONTHLY = 'EQUIPMENT_MONTHLY',
  EQUIPMENT_ANNUAL = 'EQUIPMENT_ANNUAL',
  FACILITY_WALKTHROUGH = 'FACILITY_WALKTHROUGH',
  SAFETY_AUDIT = 'SAFETY_AUDIT',
  HOUSEKEEPING = 'HOUSEKEEPING',
  FIRE_SAFETY = 'FIRE_SAFETY',
  EMERGENCY_EQUIPMENT = 'EMERGENCY_EQUIPMENT',
  PPE_COMPLIANCE = 'PPE_COMPLIANCE',
  LOTO_PERIODIC = 'LOTO_PERIODIC'
}

enum InspectionCategory {
  FORKLIFT = 'FORKLIFT',
  CRANE = 'CRANE',
  RIGGING = 'RIGGING',
  SAW = 'SAW',
  SHEAR = 'SHEAR',
  ROUTER = 'ROUTER',
  PRESS_BRAKE = 'PRESS_BRAKE',
  CONVEYOR = 'CONVEYOR',
  FIRE_EXTINGUISHER = 'FIRE_EXTINGUISHER',
  FIRST_AID = 'FIRST_AID',
  AED = 'AED',
  EYEWASH = 'EYEWASH',
  GUARDING = 'GUARDING',
  ELECTRICAL = 'ELECTRICAL',
  FACILITY = 'FACILITY',
  PPE = 'PPE'
}

enum InspectionStatus {
  SCHEDULED = 'SCHEDULED',
  OVERDUE = 'OVERDUE',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING_REVIEW = 'PENDING_REVIEW',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

enum InspectionResult {
  PASS = 'PASS',
  PASS_WITH_DEFECTS = 'PASS_WITH_DEFECTS',
  FAIL = 'FAIL',
  INCOMPLETE = 'INCOMPLETE'
}
```

### C.2.6 Incident

```typescript
interface Incident {
  id: string;                    // UUID, PK
  tenantId: string;              // FK -> Tenant
  locationId: string;            // FK -> Location
  incidentNumber: string;        // e.g., "INC-2026-0001"
  type: IncidentType;
  subType?: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  
  // When & Where
  occurredAt: DateTime;
  reportedAt: DateTime;
  shiftId?: string;              // FK -> Shift
  workCenterId?: string;         // FK -> WorkCenter
  exactLocation: string;
  
  // Who
  reporterId: string;            // FK -> User
  affectedPersonId?: string;     // FK -> User (for injuries)
  affectedPersonType: PersonType; // EMPLOYEE, CONTRACTOR, VISITOR
  witnessIds: string[];          // FK -> User[]
  supervisorId: string;          // FK -> User
  
  // What happened
  title: string;
  description: string;
  immediateActions: string;
  
  // Injury details (if applicable)
  injuryDetails?: InjuryDetails;
  
  // Property/Environmental details (if applicable)
  propertyDetails?: PropertyDetails;
  environmentalDetails?: EnvironmentalDetails;
  
  // Equipment involved
  equipmentAssetIds: string[];   // FK -> EquipmentAsset[]
  materialsInvolved?: string[];
  
  // OSHA Classification
  oshaRecordable: boolean;
  oshaClassification?: OshaClassification;
  daysAwayFromWork?: number;
  daysRestricted?: number;
  
  // Investigation
  investigationRequired: boolean;
  investigationId?: string;      // FK -> IncidentInvestigation
  
  // Root cause
  rootCauseCategory?: RootCauseCategory;
  rootCauseDescription?: string;
  contributingFactors?: string[];
  
  // Notifications
  regulatoryNotificationRequired: boolean;
  regulatoryNotificationSent?: boolean;
  regulatoryNotificationDate?: DateTime;
  
  createdAt: DateTime;
  updatedAt: DateTime;
  closedAt?: DateTime;
  closedById?: string;
  
  // Relations
  investigation?: IncidentInvestigation;
  capas: CorrectiveAction[];
  attachments: Attachment[];
  auditEvents: AuditEvent[];
}

interface InjuryDetails {
  bodyParts: string[];
  injuryNature: string;          // Laceration, Sprain, Burn, etc.
  treatmentType: TreatmentType;  // FIRST_AID, MEDICAL_TREATMENT, HOSPITALIZATION, FATALITY
  medicalProvider?: string;
  returnToWorkDate?: DateTime;
  workRestrictions?: string[];
  lostTimeStartDate?: DateTime;
  lostTimeEndDate?: DateTime;
}

interface IncidentInvestigation {
  id: string;
  incidentId: string;            // FK -> Incident
  leadInvestigatorId: string;    // FK -> User
  teamMemberIds: string[];       // FK -> User[]
  status: InvestigationStatus;
  startedAt: DateTime;
  dueDate: DateTime;
  completedAt?: DateTime;
  
  // Analysis
  fiveWhys?: FiveWhyEntry[];
  fishboneDiagram?: FishboneData;
  timelineEvents: TimelineEvent[];
  
  // Findings
  findings: InvestigationFinding[];
  
  // Recommendations
  recommendations: string[];
  
  // Report
  reportUrl?: string;
  reportApprovedById?: string;
  reportApprovedAt?: DateTime;
  
  // Signatures
  leadSignature?: string;
  leadSignedAt?: DateTime;
  ehsReviewSignature?: string;
  ehsReviewedAt?: DateTime;
}

interface InvestigationFinding {
  id: string;
  investigationId: string;
  category: FindingCategory;     // ROOT_CAUSE, CONTRIBUTING_FACTOR, SYSTEM_FAILURE, HUMAN_FACTOR
  description: string;
  evidenceRefs: string[];
  capaId?: string;               // FK -> CorrectiveAction
}

enum IncidentType {
  INJURY = 'INJURY',
  ILLNESS = 'ILLNESS',
  NEAR_MISS = 'NEAR_MISS',
  FIRST_AID = 'FIRST_AID',
  PROPERTY_DAMAGE = 'PROPERTY_DAMAGE',
  ENVIRONMENTAL = 'ENVIRONMENTAL',
  VEHICLE = 'VEHICLE',
  SECURITY = 'SECURITY',
  FIRE = 'FIRE'
}

enum IncidentStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  TRIAGED = 'TRIAGED',
  INVESTIGATING = 'INVESTIGATING',
  CAPA_ASSIGNED = 'CAPA_ASSIGNED',
  CAPA_IN_PROGRESS = 'CAPA_IN_PROGRESS',
  VERIFICATION = 'VERIFICATION',
  CLOSED = 'CLOSED',
  REOPENED = 'REOPENED'
}

enum IncidentSeverity {
  NEAR_MISS = 'NEAR_MISS',
  FIRST_AID = 'FIRST_AID',
  MINOR = 'MINOR',
  MODERATE = 'MODERATE',
  SERIOUS = 'SERIOUS',
  SEVERE = 'SEVERE',
  CATASTROPHIC = 'CATASTROPHIC'
}

enum OshaClassification {
  NOT_RECORDABLE = 'NOT_RECORDABLE',
  RECORDABLE_OTHER = 'RECORDABLE_OTHER',
  DAYS_AWAY = 'DAYS_AWAY',
  RESTRICTED_TRANSFER = 'RESTRICTED_TRANSFER',
  FATALITY = 'FATALITY'
}
```

### C.2.7 CorrectiveAction (CAPA)

```typescript
interface CorrectiveAction {
  id: string;                    // UUID, PK
  tenantId: string;              // FK -> Tenant
  locationId: string;            // FK -> Location
  capaNumber: string;            // e.g., "CAPA-2026-0001"
  type: CapaType;                // CORRECTIVE, PREVENTIVE, IMPROVEMENT
  status: CapaStatus;
  priority: Priority;
  
  // Source
  sourceType: CapaSourceType;    // INCIDENT, INSPECTION, AUDIT, OBSERVATION, PROACTIVE
  incidentId?: string;           // FK -> Incident
  inspectionId?: string;         // FK -> Inspection
  auditId?: string;              // FK -> Audit
  findingId?: string;            // FK -> InvestigationFinding or AuditFinding
  
  // Description
  title: string;
  problemDescription: string;
  rootCauseDescription?: string;
  
  // Action
  actionDescription: string;
  controlType: ControlType;      // ELIMINATION, SUBSTITUTION, ENGINEERING, ADMINISTRATIVE, PPE
  
  // Assignment
  assignedToId: string;          // FK -> User
  assignedById: string;          // FK -> User
  assignedAt: DateTime;
  
  // Timeline
  dueDate: DateTime;
  originalDueDate: DateTime;
  extensionCount: number;
  extensionReason?: string;
  
  // Implementation
  implementedAt?: DateTime;
  implementedById?: string;      // FK -> User
  implementationNotes?: string;
  implementationEvidence?: string[]; // Attachment URLs
  
  // Verification
  verificationRequired: boolean;
  verificationMethod?: string;
  verificationDueDate?: DateTime;
  verifiedAt?: DateTime;
  verifiedById?: string;         // FK -> User
  verificationNotes?: string;
  verificationEvidence?: string[];
  verificationResult?: VerificationResult;
  
  // Effectiveness
  effectivenessReviewRequired: boolean;
  effectivenessReviewDate?: DateTime;
  effectivenessReviewById?: string;
  effectivenessResult?: EffectivenessResult;
  
  // Closure
  closedAt?: DateTime;
  closedById?: string;           // FK -> User
  closureNotes?: string;
  
  // Escalation
  escalationLevel: number;
  escalatedAt?: DateTime;
  
  createdAt: DateTime;
  updatedAt: DateTime;
  
  // Relations
  incident?: Incident;
  inspection?: Inspection;
  audit?: Audit;
  attachments: Attachment[];
  auditEvents: AuditEvent[];
}

enum CapaType {
  CORRECTIVE = 'CORRECTIVE',
  PREVENTIVE = 'PREVENTIVE',
  IMPROVEMENT = 'IMPROVEMENT'
}

enum CapaStatus {
  DRAFT = 'DRAFT',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  VERIFIED = 'VERIFIED',
  PENDING_EFFECTIVENESS = 'PENDING_EFFECTIVENESS',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
  OVERDUE = 'OVERDUE',
  ESCALATED = 'ESCALATED'
}

enum CapaSourceType {
  INCIDENT = 'INCIDENT',
  INSPECTION = 'INSPECTION',
  AUDIT = 'AUDIT',
  OBSERVATION = 'OBSERVATION',
  NEAR_MISS = 'NEAR_MISS',
  PROACTIVE = 'PROACTIVE',
  REGULATORY = 'REGULATORY'
}

enum VerificationResult {
  EFFECTIVE = 'EFFECTIVE',
  PARTIALLY_EFFECTIVE = 'PARTIALLY_EFFECTIVE',
  NOT_EFFECTIVE = 'NOT_EFFECTIVE',
  REQUIRES_MODIFICATION = 'REQUIRES_MODIFICATION'
}
```

### C.2.8 Audit

```typescript
interface Audit {
  id: string;                    // UUID, PK
  tenantId: string;              // FK -> Tenant
  auditNumber: string;           // e.g., "AUD-2026-0001"
  type: AuditType;
  status: AuditStatus;
  
  // Scope
  title: string;
  scope: string;
  objectives: string[];
  criteria: string[];            // Standards/policies being audited against
  locationIds: string[];         // FK -> Location[]
  workCenterIds?: string[];      // FK -> WorkCenter[]
  
  // Schedule
  scheduledStartDate: DateTime;
  scheduledEndDate: DateTime;
  actualStartDate?: DateTime;
  actualEndDate?: DateTime;
  
  // Team
  leadAuditorId: string;         // FK -> User
  auditorIds: string[];          // FK -> User[]
  auditeeIds: string[];          // FK -> User[]
  
  // Execution
  checklistId?: string;          // FK -> AuditChecklist
  documentReviewNotes?: string;
  interviewNotes?: string;
  observationNotes?: string;
  
  // Findings
  findings: AuditFinding[];
  
  // Summary
  overallRating?: AuditRating;
  strengthsIdentified?: string[];
  areasForImprovement?: string[];
  executiveSummary?: string;
  
  // Report
  reportDraftUrl?: string;
  reportFinalUrl?: string;
  reportApprovedById?: string;
  reportApprovedAt?: DateTime;
  
  // Closeout
  closedAt?: DateTime;
  closedById?: string;
  
  createdAt: DateTime;
  updatedAt: DateTime;
  
  // Relations
  locations: Location[];
  attachments: Attachment[];
}

interface AuditFinding {
  id: string;
  auditId: string;               // FK -> Audit
  findingNumber: string;
  type: FindingType;             // NONCONFORMANCE, OBSERVATION, OPPORTUNITY, POSITIVE
  severity: FindingSeverity;     // MAJOR, MINOR, OBSERVATION
  category: string;              // Standard clause, program area
  description: string;
  evidence: string;
  objectiveEvidence?: string[];  // Attachment URLs
  rootCause?: string;
  capaRequired: boolean;
  capaId?: string;               // FK -> CorrectiveAction
  status: FindingStatus;
  responsiblePartyId?: string;   // FK -> User
  dueDate?: DateTime;
  closedAt?: DateTime;
  closedById?: string;
}

enum AuditType {
  INTERNAL = 'INTERNAL',
  EXTERNAL = 'EXTERNAL',
  REGULATORY = 'REGULATORY',
  CUSTOMER = 'CUSTOMER',
  INSURANCE = 'INSURANCE',
  MANAGEMENT_REVIEW = 'MANAGEMENT_REVIEW'
}

enum AuditStatus {
  PLANNED = 'PLANNED',
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  FINDINGS_REVIEW = 'FINDINGS_REVIEW',
  REPORT_DRAFT = 'REPORT_DRAFT',
  REPORT_FINAL = 'REPORT_FINAL',
  CAPA_TRACKING = 'CAPA_TRACKING',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED'
}
```

### C.2.9 EquipmentAsset (Safety Perspective)

```typescript
interface EquipmentAsset {
  id: string;                    // UUID, PK
  tenantId: string;              // FK -> Tenant
  locationId: string;            // FK -> Location
  workCenterId?: string;         // FK -> WorkCenter
  
  // Identification
  assetNumber: string;           // e.g., "FL-001"
  serialNumber?: string;
  name: string;
  type: EquipmentType;
  category: EquipmentCategory;
  manufacturer?: string;
  model?: string;
  yearManufactured?: number;
  
  // Status
  status: EquipmentStatus;
  safetyStatus: SafetyStatus;
  outOfServiceReason?: string;
  outOfServiceSince?: DateTime;
  outOfServiceById?: string;
  returnToServiceApprovedById?: string;
  returnToServiceAt?: DateTime;
  
  // Safety specifications
  requiresLoto: boolean;
  lotoProc
edureId?: string;        // FK -> LotoProcedure
  energySources?: EnergySource[];
  
  // Electrical (for NFPA 70E)
  arcFlashLabelId?: string;
  arcFlashCategory?: number;
  arcFlashIncidentEnergy?: number;
  arcFlashBoundary?: number;
  
  // Capacity/Ratings
  loadCapacity?: string;
  operatingPressure?: string;
  operatingVoltage?: string;
  
  // Guards
  guards: EquipmentGuard[];
  
  // Inspections
  inspectionSchedules: InspectionScheduleLink[];
  lastInspectionDate?: DateTime;
  nextInspectionDue?: DateTime;
  
  // Training requirements
  requiredTrainingIds: string[]; // FK -> TrainingCourse[]
  
  // PPE requirements
  requiredPPE: string[];
  
  // Certifications
  certificationRequired: boolean;
  certificationValidUntil?: DateTime;
  certifiedById?: string;
  certificationDocUrl?: string;
  
  createdAt: DateTime;
  updatedAt: DateTime;
  
  // Relations
  lotoProcedure?: LotoProcedure;
  inspections: Inspection[];
  permits: Permit[];
  incidents: Incident[];
}

interface EquipmentGuard {
  id: string;
  equipmentAssetId: string;
  location: string;
  type: GuardType;               // FIXED, INTERLOCKED, ADJUSTABLE, SELF_ADJUSTING
  lastInspectedAt?: DateTime;
  condition: GuardCondition;     // GOOD, DAMAGED, MISSING, BYPASSED
}

interface LotoProcedure {
  id: string;
  tenantId: string;
  equipmentAssetId: string;
  procedureNumber: string;
  version: number;
  status: ProcedureStatus;
  effectiveDate: DateTime;
  reviewDate: DateTime;
  
  // Energy sources & isolation
  energySources: EnergySource[];
  isolationSteps: IsolationStep[];
  verificationSteps: VerificationStep[];
  
  // Graphics/attachments
  equipmentPhotoUrl?: string;
  energyDiagramUrl?: string;
  
  // Approvals
  preparedById: string;
  reviewedById?: string;
  approvedById?: string;
  approvedAt?: DateTime;
  
  // Periodic inspection
  lastPeriodicInspectionDate?: DateTime;
  periodicInspectionFrequencyMonths: number;
}

enum EquipmentType {
  FORKLIFT = 'FORKLIFT',
  CRANE_OVERHEAD = 'CRANE_OVERHEAD',
  CRANE_JIB = 'CRANE_JIB',
  HOIST = 'HOIST',
  SAW_BAND = 'SAW_BAND',
  SAW_CIRCULAR = 'SAW_CIRCULAR',
  SAW_COLD = 'SAW_COLD',
  SHEAR = 'SHEAR',
  ROUTER = 'ROUTER',
  PRESS_BRAKE = 'PRESS_BRAKE',
  LATHE = 'LATHE',
  MILL = 'MILL',
  GRINDER = 'GRINDER',
  WELDER = 'WELDER',
  PLASMA_CUTTER = 'PLASMA_CUTTER',
  CONVEYOR = 'CONVEYOR',
  PALLET_JACK = 'PALLET_JACK',
  PACKAGING_MACHINE = 'PACKAGING_MACHINE',
  AIR_COMPRESSOR = 'AIR_COMPRESSOR',
  ELECTRICAL_PANEL = 'ELECTRICAL_PANEL'
}

enum EquipmentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE',
  MAINTENANCE = 'MAINTENANCE',
  DECOMMISSIONED = 'DECOMMISSIONED'
}

enum SafetyStatus {
  SAFE = 'SAFE',
  REQUIRES_INSPECTION = 'REQUIRES_INSPECTION',
  DEFECT_REPORTED = 'DEFECT_REPORTED',
  OUT_OF_SERVICE_SAFETY = 'OUT_OF_SERVICE_SAFETY',
  PERMIT_REQUIRED = 'PERMIT_REQUIRED',
  LOCKED_OUT = 'LOCKED_OUT'
}
```

### C.2.10 SDS Library

```typescript
interface SDSRecord {
  id: string;                    // UUID, PK
  tenantId: string;              // FK -> Tenant
  
  // Product identification
  productName: string;
  productCode?: string;
  manufacturer: string;
  emergencyPhone: string;
  
  // Current revision
  currentRevisionId: string;     // FK -> SDSRevision
  
  // Hazard classification
  gshHazardClasses: string[];
  signalWord?: SignalWord;       // DANGER, WARNING
  pictograms: GHSPictogram[];
  hazardStatements: string[];
  precautionaryStatements: string[];
  
  // Locations where used
  locationIds: string[];         // FK -> Location[]
  storageLocations: string[];
  
  // PPE requirements
  requiredPPE: string[];
  
  // Exposure limits
  exposureLimits?: ExposureLimit[];
  
  // Status
  isActive: boolean;
  lastReviewedAt?: DateTime;
  lastReviewedById?: string;
  
  createdAt: DateTime;
  updatedAt: DateTime;
  
  // Relations
  revisions: SDSRevision[];
}

interface SDSRevision {
  id: string;
  sdsRecordId: string;           // FK -> SDSRecord
  version: string;
  revisionDate: DateTime;
  effectiveDate: DateTime;
  pdfUrl: string;                // S3 URL
  pdfHash: string;               // SHA-256
  supersededById?: string;       // FK -> SDSRevision
  uploadedById: string;          // FK -> User
  uploadedAt: DateTime;
}

enum GHSPictogram {
  FLAME = 'FLAME',
  FLAME_OVER_CIRCLE = 'FLAME_OVER_CIRCLE',
  EXPLODING_BOMB = 'EXPLODING_BOMB',
  CORROSION = 'CORROSION',
  GAS_CYLINDER = 'GAS_CYLINDER',
  SKULL_CROSSBONES = 'SKULL_CROSSBONES',
  EXCLAMATION_MARK = 'EXCLAMATION_MARK',
  HEALTH_HAZARD = 'HEALTH_HAZARD',
  ENVIRONMENT = 'ENVIRONMENT'
}
```

### C.2.11 Safety Observation & Meetings

```typescript
interface SafetyObservation {
  id: string;                    // UUID, PK
  tenantId: string;              // FK -> Tenant
  locationId: string;            // FK -> Location
  
  // Observer
  observerId: string;            // FK -> User
  observedAt: DateTime;
  
  // Observed behavior
  type: ObservationType;         // SAFE, AT_RISK, POSITIVE_RECOGNITION
  category: ObservationCategory;
  workCenterId?: string;         // FK -> WorkCenter
  description: string;
  
  // At-risk details
  hazardIdentified?: string;
  immediateCorrection?: boolean;
  correctionDescription?: string;
  
  // Follow-up
  coachingProvided: boolean;
  coachingNotes?: string;
  followUpRequired: boolean;
  followUpAssignedTo?: string;   // FK -> User
  capaId?: string;               // FK -> CorrectiveAction
  
  // Anonymous option
  isAnonymous: boolean;
  observedPersonId?: string;     // FK -> User (if identified, for coaching)
  
  // Photos
  photos?: string[];
  
  createdAt: DateTime;
  updatedAt: DateTime;
}

interface SafetyMeeting {
  id: string;                    // UUID, PK
  tenantId: string;              // FK -> Tenant
  locationId: string;            // FK -> Location
  
  // Meeting details
  type: MeetingType;             // TOOLBOX_TALK, SAFETY_COMMITTEE, TAILGATE, PRE_SHIFT
  title: string;
  topic: string;
  description?: string;
  
  // Schedule
  scheduledAt: DateTime;
  durationMinutes: number;
  presenterId: string;           // FK -> User
  
  // Location
  workCenterIds?: string[];      // FK -> WorkCenter[]
  meetingLocation: string;
  
  // Content
  materialUrl?: string;          // Presentation, handout
  videoUrl?: string;
  discussionPoints?: string[];
  
  // Attendance
  expectedAttendeeIds: string[]; // FK -> User[]
  actualAttendees: MeetingAttendee[];
  
  // Status
  status: MeetingStatus;
  conductedAt?: DateTime;
  notes?: string;
  
  createdAt: DateTime;
  updatedAt: DateTime;
}

interface MeetingAttendee {
  id: string;
  meetingId: string;
  userId: string;
  attendedAt?: DateTime;
  signature?: string;
  signedAt?: DateTime;
}

enum ObservationType {
  SAFE = 'SAFE',
  AT_RISK = 'AT_RISK',
  POSITIVE_RECOGNITION = 'POSITIVE_RECOGNITION'
}

enum ObservationCategory {
  PPE_USE = 'PPE_USE',
  HOUSEKEEPING = 'HOUSEKEEPING',
  BODY_MECHANICS = 'BODY_MECHANICS',
  LOTO_COMPLIANCE = 'LOTO_COMPLIANCE',
  MACHINE_GUARDING = 'MACHINE_GUARDING',
  FORKLIFT_OPERATION = 'FORKLIFT_OPERATION',
  MATERIAL_HANDLING = 'MATERIAL_HANDLING',
  TOOLS_EQUIPMENT = 'TOOLS_EQUIPMENT',
  PROCEDURE_COMPLIANCE = 'PROCEDURE_COMPLIANCE',
  COMMUNICATION = 'COMMUNICATION',
  OTHER = 'OTHER'
}
```

### C.2.12 Stop Work Authority

```typescript
interface StopWorkEvent {
  id: string;                    // UUID, PK
  tenantId: string;              // FK -> Tenant
  locationId: string;            // FK -> Location
  
  // Who issued
  issuedById: string;            // FK -> User
  issuedAt: DateTime;
  
  // What was stopped
  workCenterId?: string;         // FK -> WorkCenter
  equipmentAssetId?: string;     // FK -> EquipmentAsset
  jobOrderId?: string;           // FK -> JobOrder
  permitId?: string;             // FK -> Permit
  
  // Why
  hazardType: HazardType;
  hazardDescription: string;
  immediateDanger: boolean;
  
  // Status
  status: StopWorkStatus;
  
  // Acknowledgement
  acknowledgedById?: string;     // FK -> User (Supervisor)
  acknowledgedAt?: DateTime;
  acknowledgementNotes?: string;
  
  // Mitigation
  mitigationActions?: string[];
  mitigatedById?: string;
  mitigatedAt?: DateTime;
  mitigationVerifiedById?: string;
  
  // Resume
  resumeAuthorizedById?: string; // FK -> User (EHS/Supervisor)
  resumeAuthorizedAt?: DateTime;
  resumeConditions?: string;
  
  // Related records
  incidentId?: string;           // FK -> Incident (if incident resulted)
  capaId?: string;               // FK -> CorrectiveAction
  
  createdAt: DateTime;
  updatedAt: DateTime;
  
  // Relations
  attachments: Attachment[];
}

enum StopWorkStatus {
  ISSUED = 'ISSUED',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  MITIGATION_IN_PROGRESS = 'MITIGATION_IN_PROGRESS',
  MITIGATION_COMPLETE = 'MITIGATION_COMPLETE',
  RESUME_AUTHORIZED = 'RESUME_AUTHORIZED',
  CLOSED = 'CLOSED'
}
```

### C.2.13 PPE Requirement Matrix

```typescript
interface PPERequirementMatrix {
  id: string;                    // UUID, PK
  tenantId: string;              // FK -> Tenant
  locationId?: string;           // FK -> Location (null = all)
  
  // Scope
  name: string;
  description: string;
  version: number;
  effectiveDate: DateTime;
  
  // Matrix entries
  entries: PPEMatrixEntry[];
  
  // Approvals
  approvedById?: string;
  approvedAt?: DateTime;
  
  isActive: boolean;
  createdAt: DateTime;
  updatedAt: DateTime;
}

interface PPEMatrixEntry {
  id: string;
  matrixId: string;
  
  // Scope (at least one required)
  workCenterId?: string;         // FK -> WorkCenter
  taskType?: string;
  equipmentType?: EquipmentType;
  hazardType?: HazardType;
  materialType?: string;
  
  // Required PPE
  requiredPPE: PPEItem[];
  
  // Notes
  notes?: string;
  exceptions?: string;
}

interface PPEItem {
  category: PPECategory;
  specification: string;
  mandatory: boolean;
  alternativeAllowed?: string;
}

enum PPECategory {
  HEAD = 'HEAD',
  EYE_FACE = 'EYE_FACE',
  HEARING = 'HEARING',
  RESPIRATORY = 'RESPIRATORY',
  HAND = 'HAND',
  BODY = 'BODY',
  FOOT = 'FOOT',
  FALL_PROTECTION = 'FALL_PROTECTION',
  HIGH_VISIBILITY = 'HIGH_VISIBILITY',
  ELECTRICAL = 'ELECTRICAL',
  THERMAL = 'THERMAL',
  CHEMICAL = 'CHEMICAL'
}
```

### C.2.14 Contractor/Visitor Safety

```typescript
interface ContractorCompany {
  id: string;                    // UUID, PK
  tenantId: string;              // FK -> Tenant
  
  // Company info
  name: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  
  // Prequalification
  prequalificationStatus: PrequalStatus;
  prequalificationDate?: DateTime;
  prequalificationExpiry?: DateTime;
  insuranceCertUrl?: string;
  insuranceExpiry?: DateTime;
  safetyProgramReviewed: boolean;
  emr?: number;                  // Experience Modification Rate
  
  // Training requirements met
  orientationComplete: boolean;
  siteSpecificTrainingIds: string[];
  
  isActive: boolean;
  createdAt: DateTime;
  updatedAt: DateTime;
  
  // Relations
  workers: ContractorWorker[];
}

interface ContractorWorker {
  id: string;                    // UUID, PK
  contractorCompanyId: string;   // FK -> ContractorCompany
  tenantId: string;
  
  // Worker info
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  badgeNumber?: string;
  
  // Orientation & training
  orientationCompletedAt?: DateTime;
  orientationSignature?: string;
  siteSpecificTrainingCompletions: TrainingCompletionRef[];
  
  // Access
  accessLocations: string[];     // FK -> Location[]
  accessValidFrom?: DateTime;
  accessValidTo?: DateTime;
  
  isActive: boolean;
  createdAt: DateTime;
  updatedAt: DateTime;
}

interface VisitorSignIn {
  id: string;                    // UUID, PK
  tenantId: string;
  locationId: string;            // FK -> Location
  
  // Visitor info
  visitorName: string;
  visitorCompany?: string;
  visitorPhone?: string;
  visitorEmail?: string;
  
  // Visit
  hostId: string;                // FK -> User
  purpose: string;
  areasVisiting: string[];
  
  // Check-in/out
  checkInAt: DateTime;
  checkOutAt?: DateTime;
  badgeIssued?: string;
  
  // Safety acknowledgement
  safetyRulesAcknowledged: boolean;
  acknowledgementSignature?: string;
  acknowledgementSignedAt?: DateTime;
  
  // Emergency contact
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

### C.2.15 Immutable Audit Event

```typescript
interface SafetyAuditEvent {
  id: string;                    // UUID, PK (auto-generated, never editable)
  tenantId: string;              // FK -> Tenant
  correlationId: string;         // Groups related events (e.g., workflow)
  
  // Actor
  actorId: string;               // FK -> User (or 'SYSTEM')
  actorType: ActorType;          // USER, SYSTEM, API_KEY, INTEGRATION
  actorIp?: string;
  actorUserAgent?: string;
  
  // Action
  action: AuditAction;
  resourceType: ResourceType;
  resourceId: string;
  
  // Change details
  previousState?: object;        // JSON snapshot before
  newState?: object;             // JSON snapshot after
  changedFields?: string[];
  
  // Metadata
  reason?: string;
  workflowState?: string;
  signatureData?: SignatureData;
  
  // Timestamp (immutable)
  occurredAt: DateTime;          // Set by database, not application
  
  // Indexing
  locationId?: string;
  workCenterId?: string;
  
  // Hash for chain integrity (optional blockchain-style)
  previousEventHash?: string;
  eventHash: string;             // SHA-256 of event data
}

interface SignatureData {
  signerId: string;
  signerName: string;
  signedAt: DateTime;
  signatureValue: string;        // Electronic signature
  signatureMethod: SignatureMethod;
  attestation: string;           // Legal text acknowledged
}

enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  SUBMIT = 'SUBMIT',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  SIGN = 'SIGN',
  CLOSE = 'CLOSE',
  REOPEN = 'REOPEN',
  ESCALATE = 'ESCALATE',
  ASSIGN = 'ASSIGN',
  VERIFY = 'VERIFY',
  LOCK = 'LOCK',
  UNLOCK = 'UNLOCK',
  EXPORT = 'EXPORT',
  VIEW = 'VIEW',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT'
}

enum ResourceType {
  POLICY_DOCUMENT = 'POLICY_DOCUMENT',
  TRAINING_COURSE = 'TRAINING_COURSE',
  TRAINING_ASSIGNMENT = 'TRAINING_ASSIGNMENT',
  TRAINING_COMPLETION = 'TRAINING_COMPLETION',
  JHA = 'JHA',
  PERMIT = 'PERMIT',
  PERMIT_LOTO = 'PERMIT_LOTO',
  PERMIT_HOT_WORK = 'PERMIT_HOT_WORK',
  PERMIT_ELECTRICAL = 'PERMIT_ELECTRICAL',
  PERMIT_CONFINED_SPACE = 'PERMIT_CONFINED_SPACE',
  INSPECTION = 'INSPECTION',
  INSPECTION_DEFECT = 'INSPECTION_DEFECT',
  INCIDENT = 'INCIDENT',
  INCIDENT_INVESTIGATION = 'INCIDENT_INVESTIGATION',
  CAPA = 'CAPA',
  AUDIT = 'AUDIT',
  AUDIT_FINDING = 'AUDIT_FINDING',
  EQUIPMENT_ASSET = 'EQUIPMENT_ASSET',
  SDS_RECORD = 'SDS_RECORD',
  SAFETY_OBSERVATION = 'SAFETY_OBSERVATION',
  SAFETY_MEETING = 'SAFETY_MEETING',
  STOP_WORK_EVENT = 'STOP_WORK_EVENT',
  PPE_MATRIX = 'PPE_MATRIX',
  CONTRACTOR = 'CONTRACTOR',
  VISITOR = 'VISITOR'
}
```

## C.3 Required Indexes

```sql
-- Performance indexes for common queries

-- Training lookups
CREATE INDEX idx_training_assignment_user_status ON training_assignment(user_id, status);
CREATE INDEX idx_training_assignment_due_date ON training_assignment(due_date) WHERE status NOT IN ('COMPLETED', 'WAIVED');
CREATE INDEX idx_training_completion_user ON training_completion(user_id);
CREATE INDEX idx_training_completion_expiry ON training_completion(expires_at) WHERE expires_at IS NOT NULL;

-- Inspection schedules
CREATE INDEX idx_inspection_scheduled_date ON inspection(scheduled_date, status);
CREATE INDEX idx_inspection_equipment ON inspection(equipment_asset_id);
CREATE INDEX idx_inspection_location ON inspection(location_id);

-- Permit lookups
CREATE INDEX idx_permit_status ON permit(status);
CREATE INDEX idx_permit_valid_dates ON permit(valid_from, valid_to) WHERE status = 'ACTIVE';
CREATE INDEX idx_permit_work_center ON permit(work_center_id);
CREATE INDEX idx_permit_equipment ON permit(equipment_asset_ids) USING GIN;

-- Incident queries
CREATE INDEX idx_incident_status ON incident(status);
CREATE INDEX idx_incident_occurred ON incident(occurred_at);
CREATE INDEX idx_incident_location ON incident(location_id);
CREATE INDEX idx_incident_osha ON incident(osha_recordable, occurred_at) WHERE osha_recordable = true;

-- CAPA tracking
CREATE INDEX idx_capa_status_due ON capa(status, due_date);
CREATE INDEX idx_capa_assigned_to ON capa(assigned_to_id);
CREATE INDEX idx_capa_source ON capa(source_type, source_id);

-- Equipment safety
CREATE INDEX idx_equipment_safety_status ON equipment_asset(safety_status);
CREATE INDEX idx_equipment_next_inspection ON equipment_asset(next_inspection_due);
CREATE INDEX idx_equipment_loto ON equipment_asset(requires_loto) WHERE requires_loto = true;

-- Audit trail
CREATE INDEX idx_safety_audit_event_resource ON safety_audit_event(resource_type, resource_id);
CREATE INDEX idx_safety_audit_event_actor ON safety_audit_event(actor_id);
CREATE INDEX idx_safety_audit_event_correlation ON safety_audit_event(correlation_id);
CREATE INDEX idx_safety_audit_event_occurred ON safety_audit_event(occurred_at);

-- Policy acknowledgements
CREATE INDEX idx_policy_ack_user ON policy_acknowledgement(user_id);
CREATE INDEX idx_policy_ack_policy ON policy_acknowledgement(policy_id);
```

---

*Continued in Part 2: Workflows (D), UI/UX (E), Roles & Permissions (F)*
