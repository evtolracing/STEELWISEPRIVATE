# 85 — STOP-WORK AUTHORITY (SWA) SYSTEM DESIGN

## Document Control
| Version | Date | Author | Status |
|---------|------|--------|--------|
| 1.0 | 2026-02-04 | Safety Systems Architect | APPROVED |

---

## 1. EXECUTIVE SUMMARY

The Stop-Work Authority (SWA) system provides **immediate, non-bypassable halt capability** for any unsafe condition within the SteelWise platform. This system integrates directly with the Dispatch Engine, Job Lifecycle, Work Center Management, and Safety AI Assistant to ensure safety always supersedes production priorities.

**Core Principles:**
- Any employee may INITIATE a Stop-Work
- Only authorized roles may CLEAR a Stop-Work
- NO OVERRIDES are permitted
- All events are immutably logged
- Dispatch Engine automatically respects all blocks

---

## 2. STOP-WORK DATA MODEL

### 2.1 Core Entity: `StopWorkEvent`

```prisma
model StopWorkEvent {
  id                String   @id @default(cuid())
  eventNumber       String   @unique // SWA-2026-0001
  
  // Scope Definition
  scopeType         SWAScopeType
  scopeId           String   // Job ID, Work Center ID, Asset ID, etc.
  scopeDescription  String   // Human-readable description
  
  // Event Details
  reasonCode        SWAReasonCode
  severity          SWASeverity
  description       String   @db.Text
  immediateCause    String?
  
  // Policy Reference
  relatedPolicyId   String?
  relatedPolicy     SafetyPolicy? @relation(fields: [relatedPolicyId], references: [id])
  
  // Initiation
  initiatedBy       String   // User ID
  initiatedByRole   String   // Role at time of initiation
  initiatedBySource SWASource
  initiatedAt       DateTime @default(now())
  
  // Status
  status            SWAStatus @default(ACTIVE)
  
  // Clearance (when resolved)
  clearedBy         String?
  clearedByRole     String?
  clearedAt         DateTime?
  clearanceNotes    String?   @db.Text
  
  // Audit Trail
  auditTrail        SWAAuditEntry[]
  
  // Related Entities
  relatedJobId      String?
  relatedJob        Job?      @relation(fields: [relatedJobId], references: [id])
  relatedAssetId    String?
  relatedIncidentId String?
  relatedPermitId   String?
  relatedCAPAId     String?
  
  // Clearance Requirements
  clearanceSteps    SWAClearanceStep[]
  requiredEvidence  SWAEvidence[]
  
  // Impact Tracking
  affectedJobs      String[]  // Array of Job IDs
  affectedOperators String[]  // Array of User IDs
  estimatedDowntime Int?      // Minutes
  actualDowntime    Int?      // Minutes
  
  // Timestamps
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@index([status])
  @@index([scopeType, scopeId])
  @@index([initiatedAt])
}

enum SWAScopeType {
  OPERATION      // Single job operation
  JOB            // Entire job
  WORK_CENTER    // All jobs on a work center
  ASSET          // Specific equipment (forklift, crane, etc.)
  AREA           // Bay, zone, dock
  LOCATION       // Entire branch/facility
}

enum SWAReasonCode {
  // Permit Related
  MISSING_LOTO_PERMIT
  EXPIRED_LOTO_PERMIT
  MISSING_HOT_WORK_PERMIT
  EXPIRED_HOT_WORK_PERMIT
  MISSING_CONFINED_SPACE_PERMIT
  PERMIT_VIOLATION
  
  // Inspection Related
  OVERDUE_INSPECTION
  FAILED_INSPECTION
  INSPECTION_FINDING_CRITICAL
  
  // Equipment Related
  EQUIPMENT_MALFUNCTION
  MISSING_GUARD
  GUARD_BYPASSED
  EQUIPMENT_OUT_OF_SERVICE
  EQUIPMENT_UNSAFE_CONDITION
  
  // Training Related
  OPERATOR_TRAINING_EXPIRED
  OPERATOR_NOT_QUALIFIED
  
  // Hazard Related
  SDS_HAZARD_ESCALATION
  CHEMICAL_SPILL
  ENVIRONMENTAL_HAZARD
  FIRE_HAZARD
  
  // Incident Related
  INCIDENT_UNDER_INVESTIGATION
  NEAR_MISS_PATTERN_DETECTED
  CAPA_OPEN_ON_ASSET
  
  // Operator Initiated
  OPERATOR_SAFETY_CONCERN
  UNSAFE_WORK_CONDITION
  
  // System Detected
  SYSTEM_AUTO_BLOCK
  AI_SAFETY_INTERVENTION
  
  // Other
  EHS_DIRECTIVE
  MANAGEMENT_DIRECTIVE
  EXTERNAL_REGULATORY
}

enum SWASeverity {
  CRITICAL    // Immediate danger to life
  HIGH        // Potential serious injury
  MEDIUM      // Moderate injury risk
  LOW         // Minor safety concern
}

enum SWASource {
  OPERATOR
  SUPERVISOR
  SAFETY_AI_ASSISTANT
  EHS_PERSONNEL
  MAINTENANCE
  SYSTEM_AUTO
  MANAGEMENT
}

enum SWAStatus {
  ACTIVE              // Stop-Work in effect
  UNDER_INVESTIGATION // Being reviewed
  MITIGATION_IN_PROGRESS
  PENDING_VERIFICATION
  PENDING_APPROVAL
  CLEARED             // Resolved, work may resume
  ESCALATED           // Escalated to higher authority
}
```

### 2.2 Clearance Step Model

```prisma
model SWAClearanceStep {
  id              String   @id @default(cuid())
  stopWorkEventId String
  stopWorkEvent   StopWorkEvent @relation(fields: [stopWorkEventId], references: [id])
  
  stepNumber      Int
  description     String
  requiredRole    String   // Role required to complete this step
  
  status          ClearanceStepStatus @default(PENDING)
  completedBy     String?
  completedAt     DateTime?
  notes           String?
  evidenceIds     String[] // References to SWAEvidence
  
  createdAt       DateTime @default(now())
}

enum ClearanceStepStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  SKIPPED       // Only by EHS override with justification
  BLOCKED
}
```

### 2.3 Evidence Model

```prisma
model SWAEvidence {
  id              String   @id @default(cuid())
  stopWorkEventId String
  stopWorkEvent   StopWorkEvent @relation(fields: [stopWorkEventId], references: [id])
  
  evidenceType    EvidenceType
  description     String
  fileUrl         String?
  fileName        String?
  mimeType        String?
  
  uploadedBy      String
  uploadedAt      DateTime @default(now())
  
  verified        Boolean  @default(false)
  verifiedBy      String?
  verifiedAt      DateTime?
}

enum EvidenceType {
  PHOTO
  VIDEO
  DOCUMENT
  INSPECTION_REPORT
  PERMIT_COPY
  TRAINING_RECORD
  SIGNATURE
  CHECKLIST
  OTHER
}
```

### 2.4 Audit Entry Model

```prisma
model SWAAuditEntry {
  id              String   @id @default(cuid())
  stopWorkEventId String
  stopWorkEvent   StopWorkEvent @relation(fields: [stopWorkEventId], references: [id])
  
  action          SWAAuditAction
  description     String
  previousValue   Json?
  newValue        Json?
  
  performedBy     String
  performedByRole String
  performedAt     DateTime @default(now())
  
  ipAddress       String?
  userAgent       String?
  
  // Immutability guarantee
  hash            String   // SHA-256 hash of entry content
  previousHash    String?  // Chain to previous entry
  
  @@index([stopWorkEventId, performedAt])
}

enum SWAAuditAction {
  INITIATED
  ACKNOWLEDGED
  ESCALATED
  INVESTIGATION_STARTED
  INVESTIGATION_COMPLETED
  MITIGATION_STARTED
  MITIGATION_COMPLETED
  EVIDENCE_ADDED
  STEP_COMPLETED
  VERIFICATION_REQUESTED
  VERIFICATION_COMPLETED
  APPROVAL_REQUESTED
  APPROVED
  REJECTED
  CLEARED
  REOPENED
  COMMENT_ADDED
  SCOPE_EXPANDED
  SCOPE_REDUCED
}
```

---

## 3. STATE TRANSITION TABLE

### 3.1 StopWorkEvent Status Transitions

```
┌─────────────────────┐
│       ACTIVE        │ ← Initial state when Stop-Work initiated
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ UNDER_INVESTIGATION │ ← When investigation begins (optional)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ MITIGATION_IN_PROGRESS │ ← Corrective actions being implemented
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ PENDING_VERIFICATION │ ← Awaiting verification of fix
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  PENDING_APPROVAL   │ ← Awaiting authorized clearance
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│      CLEARED        │ ← Work may resume
└─────────────────────┘
```

### 3.2 Transition Rules

| From Status | To Status | Required Role | Conditions |
|-------------|-----------|---------------|------------|
| ACTIVE | UNDER_INVESTIGATION | Supervisor, EHS | When investigation needed |
| ACTIVE | MITIGATION_IN_PROGRESS | Any authorized | For direct fixes |
| ACTIVE | ESCALATED | System, EHS | When severity increases |
| UNDER_INVESTIGATION | MITIGATION_IN_PROGRESS | EHS | Investigation complete |
| MITIGATION_IN_PROGRESS | PENDING_VERIFICATION | Assigned personnel | Mitigation complete |
| PENDING_VERIFICATION | PENDING_APPROVAL | Verifier | Verification passed |
| PENDING_VERIFICATION | MITIGATION_IN_PROGRESS | Verifier | Verification failed |
| PENDING_APPROVAL | CLEARED | Authorized approver | All steps complete |
| PENDING_APPROVAL | MITIGATION_IN_PROGRESS | Approver | Approval rejected |
| CLEARED | ACTIVE | EHS, System | Reopened due to recurrence |

### 3.3 Job State Transitions with SWA

```
Standard Job States:
CREATED → READY → IN_PROCESS → COMPLETE

With Stop-Work Authority:

                    ┌──── STOPPED_BY_SAFETY ◄────┐
                    │            │               │
                    ▼            ▼               │
CREATED → READY → IN_PROCESS ───────────────────┘
            │         │
            │         └───→ COMPLETE
            │
            └──── STOPPED_BY_SAFETY
```

**Rules:**
1. ANY job state can transition to `STOPPED_BY_SAFETY`
2. `STOPPED_BY_SAFETY` can ONLY transition to `READY` or `IN_PROCESS` (resume previous state)
3. Transition OUT of `STOPPED_BY_SAFETY` requires SWA clearance
4. Operators CANNOT transition out of `STOPPED_BY_SAFETY`

### 3.4 Operation State Transitions with SWA

| Current State | Event | New State | Condition |
|---------------|-------|-----------|-----------|
| QUEUED | SWA Initiated | STOPPED_BY_SAFETY | Scope matches |
| ACTIVE | SWA Initiated | STOPPED_BY_SAFETY | Immediate halt |
| STOPPED_BY_SAFETY | SWA Cleared | QUEUED | Re-enter queue |
| STOPPED_BY_SAFETY | SWA Cleared | ACTIVE | Resume work |
| WAITING_CLEARANCE | SWA Cleared | ACTIVE | Clearance granted |

---

## 4. DISPATCH ENGINE INTEGRATION RULES

### 4.1 Dispatch Query Filters

When generating work assignments, Dispatch Engine MUST apply these filters:

```typescript
interface DispatchSafetyFilters {
  // Exclude jobs with active Stop-Work
  excludeBlockedJobs: boolean = true;
  
  // Exclude work centers with active Stop-Work
  excludeBlockedWorkCenters: boolean = true;
  
  // Exclude operators with training/certification issues
  excludeUnqualifiedOperators: boolean = true;
  
  // Exclude assets with active Stop-Work
  excludeBlockedAssets: boolean = true;
  
  // Exclude areas with active Stop-Work
  excludeBlockedAreas: boolean = true;
}
```

### 4.2 Pre-Assignment Safety Checks

Before ANY job assignment, Dispatch MUST verify:

```typescript
async function validateAssignment(assignment: JobAssignment): Promise<SafetyValidation> {
  const checks = [
    checkActiveStopWork(assignment.jobId),
    checkWorkCenterStatus(assignment.workCenterId),
    checkAssetStatus(assignment.assetId),
    checkAreaStatus(assignment.areaId),
    checkOperatorQualifications(assignment.operatorId, assignment.requiredSkills),
    checkRequiredPermits(assignment.jobId),
    checkEquipmentInspections(assignment.assetId),
    checkOperatorTraining(assignment.operatorId),
  ];
  
  const results = await Promise.all(checks);
  
  return {
    isValid: results.every(r => r.passed),
    blocks: results.filter(r => !r.passed),
    warnings: results.filter(r => r.warning),
  };
}
```

### 4.3 Dispatch Behavior Matrix

| Condition | Dispatch Action | UI Display |
|-----------|-----------------|------------|
| Active SWA on Job | Remove from queue | "🛑 Blocked by Safety" |
| Active SWA on Work Center | Skip work center | "⚠️ Work Center Blocked" |
| Active SWA on Asset | Exclude asset | "🔒 Asset Out of Service" |
| Active SWA on Area | Skip area jobs | "🚫 Area Restricted" |
| Operator training expired | Exclude operator | "📋 Training Required" |
| Permit missing/expired | Block job start | "📝 Permit Required" |
| Inspection overdue | Block asset | "🔍 Inspection Overdue" |

### 4.4 Automatic Re-routing

When Stop-Work blocks a resource, Dispatch SHOULD:

1. **Identify alternate resources** that can perform the operation
2. **Calculate impact** of re-routing (time, cost, capacity)
3. **Propose alternatives** to scheduler/supervisor
4. **Never auto-assign** blocked work elsewhere without review

```typescript
interface AlternateRouting {
  originalAssignment: JobAssignment;
  alternatives: AlternativeOption[];
  recommendedOption: AlternativeOption | null;
  impactAnalysis: {
    delayMinutes: number;
    costDelta: number;
    qualityRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  };
}
```

### 4.5 Dispatch Cannot Override

Dispatch Engine is PROHIBITED from:

- ❌ Ignoring active Stop-Work events
- ❌ "Force assign" to blocked resources
- ❌ Auto-clearing safety blocks
- ❌ Hiding safety warnings from users
- ❌ Allowing backdated assignments
- ❌ Bypassing qualification checks

---

## 5. ROLE AUTHORITY MATRIX

### 5.1 Initiation Authority

| Role | Can Initiate | Scope Limits |
|------|--------------|--------------|
| Operator | ✅ Yes | Operation, Job, Work Center |
| Supervisor | ✅ Yes | All except Location |
| Maintenance | ✅ Yes | Asset, Work Center |
| EHS Personnel | ✅ Yes | ALL scopes |
| Safety AI Assistant | ✅ Yes | ALL scopes (system-triggered) |
| Ops Manager | ✅ Yes | All except Location |
| Branch Manager | ✅ Yes | ALL scopes |

### 5.2 Clearance Authority

| Role | Can Clear | Severity Limits | Scope Limits |
|------|-----------|-----------------|--------------|
| Operator | ❌ No | — | — |
| Supervisor | ✅ Yes | LOW only | Operation, Job |
| Maintenance Lead | ✅ Yes | LOW, MEDIUM | Asset-related only |
| EHS Manager | ✅ Yes | ALL | ALL except Location |
| Ops Manager | ✅ Yes | LOW, MEDIUM | Job, Work Center |
| Branch Manager | ✅ Yes | ALL | ALL |

### 5.3 Override Authority

| Role | Can Override |
|------|--------------|
| ALL | ❌ NO OVERRIDES PERMITTED |

**Rationale:** Overrides create liability exposure and undermine safety culture. If a Stop-Work is truly invalid, it must go through the clearance process with documentation.

---

## 6. UI BEHAVIOR SUMMARY

### 6.1 Operator UI

**When Stop-Work is ACTIVE:**

```
┌─────────────────────────────────────────────────────────────┐
│  🛑  WORK STOPPED — SAFETY HOLD                             │
│                                                             │
│  Reason: Missing LOTO Permit                                │
│  Policy: LOTO-POL-001 Section 4.2                           │
│                                                             │
│  ⚠️  You may NOT continue work until this is resolved.      │
│                                                             │
│  Required Actions:                                          │
│  1. Secure equipment in current state                       │
│  2. Do not attempt any adjustments                          │
│  3. Wait for supervisor instruction                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  [ I Acknowledge This Safety Stop ]                     ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  Supervisor notified: Sarah Williams                        │
│  EHS notified: Safety Team                                  │
└─────────────────────────────────────────────────────────────┘
```

**Allowed Actions:**
- ✅ Acknowledge Stop-Work
- ✅ Add comments/observations
- ✅ View policy reference
- ❌ Resume work
- ❌ Cancel Stop-Work
- ❌ Bypass controls

### 6.2 Supervisor UI

**When Stop-Work requires action:**

```
┌─────────────────────────────────────────────────────────────┐
│  🛑  STOP-WORK EVENT: SWA-2026-0042                         │
├─────────────────────────────────────────────────────────────┤
│  Status: PENDING_VERIFICATION                               │
│  Severity: MEDIUM                                           │
│  Scope: Work Center — SAW-01                                │
│  Initiated: 2026-02-04 09:15 by Mike Johnson (Operator)     │
│                                                             │
│  Reason: Suspected guard misalignment                       │
│                                                             │
│  CLEARANCE CHECKLIST:                                       │
│  ☑️ 1. Guard inspected by Maintenance                       │
│  ☑️ 2. Guard realigned and secured                          │
│  ☐ 3. Test cut performed (no material)                      │
│  ☐ 4. Verification photos uploaded                          │
│  ☐ 5. Supervisor approval                                   │
│                                                             │
│  Evidence:                                                  │
│  📷 guard_before.jpg — Uploaded 09:22                       │
│  📷 guard_after.jpg — Uploaded 09:45                        │
│                                                             │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐              │
│  │  Approve   │ │   Reject   │ │  Escalate  │              │
│  └────────────┘ └────────────┘ └────────────┘              │
│                                                             │
│  Affected Jobs: J-2026-0891, J-2026-0892                    │
│  Estimated Impact: 45 minutes delay                         │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 Ops Manager UI

**Schedule Impact View:**

```
┌─────────────────────────────────────────────────────────────┐
│  ACTIVE SAFETY BLOCKS — Schedule Impact                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ⚠️ 2 Active Stop-Work Events                               │
│                                                             │
│  1. SAW-01 — Guard Issue (MEDIUM)                           │
│     └─ 3 jobs delayed, ~45 min impact                       │
│     └─ Alternative: Route to SAW-02 (+15 min setup)         │
│                                                             │
│  2. FORKLIFT-05 — Inspection Overdue (LOW)                  │
│     └─ 5 material moves affected                            │
│     └─ Alternative: Use FORKLIFT-03 (available)             │
│                                                             │
│  RECOMMENDED ACTIONS:                                       │
│  • Approve re-routing of J-2026-0891 to SAW-02              │
│  • Expedite inspection for FORKLIFT-05                      │
│                                                             │
│  ┌─────────────────┐ ┌─────────────────┐                    │
│  │ Accept Routing  │ │ View Full List  │                    │
│  └─────────────────┘ └─────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

### 6.4 EHS Dashboard

**Full Audit & Investigation View:**

```
┌─────────────────────────────────────────────────────────────┐
│  EHS STOP-WORK AUTHORITY DASHBOARD                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  SUMMARY (Last 30 Days)                                     │
│  ┌──────────┬──────────┬──────────┬──────────┐             │
│  │ Active   │ Cleared  │ Avg Time │ Repeat   │             │
│  │    2     │    14    │  2.3 hrs │    1     │             │
│  └──────────┴──────────┴──────────┴──────────┘             │
│                                                             │
│  BY REASON CODE:                                            │
│  ████████░░ Missing Permit (8)                              │
│  ████░░░░░░ Equipment Issue (4)                             │
│  ██░░░░░░░░ Operator Concern (2)                            │
│  ██░░░░░░░░ Inspection Overdue (2)                          │
│                                                             │
│  ACTIVE EVENTS:                                             │
│  • SWA-2026-0042 — SAW-01 Guard — PENDING_VERIFICATION      │
│  • SWA-2026-0043 — FORKLIFT-05 — ACTIVE                     │
│                                                             │
│  LINKED TO OPEN CAPAs: 3                                    │
│  LINKED TO INCIDENTS: 1                                     │
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │ Full Audit  │ │   Export    │ │ Trend Report│            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. AUDIT LOG SCHEMA

### 7.1 Immutable Audit Chain

Each audit entry is cryptographically chained:

```typescript
interface SWAAuditEntry {
  id: string;
  stopWorkEventId: string;
  
  // Action Details
  action: SWAAuditAction;
  description: string;
  previousValue?: object;
  newValue?: object;
  
  // Actor
  performedBy: string;      // User ID
  performedByRole: string;
  performedAt: Date;
  
  // Context
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  
  // Immutability Chain
  entryHash: string;        // SHA-256(content + previousHash)
  previousHash: string;     // Links to previous entry
  
  // Cannot be modified after creation
  readonly: true;
}
```

### 7.2 Hash Calculation

```typescript
function calculateEntryHash(entry: Partial<SWAAuditEntry>, previousHash: string): string {
  const content = JSON.stringify({
    stopWorkEventId: entry.stopWorkEventId,
    action: entry.action,
    description: entry.description,
    previousValue: entry.previousValue,
    newValue: entry.newValue,
    performedBy: entry.performedBy,
    performedByRole: entry.performedByRole,
    performedAt: entry.performedAt.toISOString(),
    previousHash: previousHash,
  });
  
  return crypto.createHash('sha256').update(content).digest('hex');
}
```

### 7.3 Audit Record Retention

| Data Type | Retention Period | Archive Policy |
|-----------|------------------|----------------|
| Active SWA Events | Indefinite | N/A |
| Cleared SWA Events | 7 years | Cold storage after 1 year |
| Audit Entries | 7 years | Immutable, no deletion |
| Evidence Files | 7 years | Archived after clearance |

---

## 8. SAFETY AI ASSISTANT INTEGRATION

### 8.1 AI-Initiated Stop-Work Triggers

The Safety AI Assistant MUST automatically initiate Stop-Work when:

```typescript
const AI_AUTO_STOP_WORK_TRIGGERS = [
  {
    condition: 'LOTO permit required but missing',
    reasonCode: 'MISSING_LOTO_PERMIT',
    severity: 'HIGH',
    scope: 'OPERATION',
  },
  {
    condition: 'Hot Work permit expired during job',
    reasonCode: 'EXPIRED_HOT_WORK_PERMIT',
    severity: 'HIGH',
    scope: 'OPERATION',
  },
  {
    condition: 'Operator training expired for required skill',
    reasonCode: 'OPERATOR_TRAINING_EXPIRED',
    severity: 'MEDIUM',
    scope: 'OPERATION',
  },
  {
    condition: 'Equipment inspection overdue > 24 hours',
    reasonCode: 'OVERDUE_INSPECTION',
    severity: 'MEDIUM',
    scope: 'ASSET',
  },
  {
    condition: 'Critical CAPA open on asset',
    reasonCode: 'CAPA_OPEN_ON_ASSET',
    severity: 'HIGH',
    scope: 'ASSET',
  },
  {
    condition: 'Guard interlock bypassed',
    reasonCode: 'GUARD_BYPASSED',
    severity: 'CRITICAL',
    scope: 'WORK_CENTER',
  },
];
```

### 8.2 AI Response Templates

**When Stop-Work is triggered:**

```
🛑 STOP-WORK INITIATED

I have initiated a Stop-Work on [SCOPE] due to:
[REASON]

**Policy Reference:** [POLICY_ID] Section [X.X]

**Why This Matters:**
[EXPLANATION OF RISK]

**Immediate Actions Required:**
1. [ACTION 1]
2. [ACTION 2]
3. [ACTION 3]

**Who Has Been Notified:**
- Supervisor: [NAME]
- EHS: [NAME/TEAM]

**Next Steps:**
[CLEARANCE REQUIREMENTS]

This Stop-Work cannot be bypassed. Work may only resume after 
proper clearance through the safety system.
```

### 8.3 AI Clearance Validation

Before recommending clearance, AI MUST verify:

```typescript
async function validateClearanceReadiness(swaId: string): Promise<ClearanceValidation> {
  const swa = await getStopWorkEvent(swaId);
  
  const validations = {
    allStepsComplete: swa.clearanceSteps.every(s => s.status === 'COMPLETED'),
    requiredEvidencePresent: swa.requiredEvidence.length >= swa.requiredEvidenceCount,
    evidenceVerified: swa.requiredEvidence.every(e => e.verified),
    mitigationDocumented: !!swa.mitigationNotes,
    verificationPassed: swa.verificationResult === 'PASSED',
    approverAuthorized: checkApproverAuthority(swa.severity, swa.scopeType),
  };
  
  return {
    ready: Object.values(validations).every(v => v === true),
    missing: Object.entries(validations)
      .filter(([_, v]) => !v)
      .map(([k, _]) => k),
  };
}
```

---

## 9. VALIDATION CHECKLIST

### 9.1 Test Scenarios

| # | Scenario | Expected Outcome | Validation |
|---|----------|------------------|------------|
| 1 | Operator triggers Stop-Work mid-operation | Job immediately halts, supervisor notified, audit logged | ☐ |
| 2 | Missing LOTO permit blocks blade adjustment | AI Assistant blocks start, generates permit draft | ☐ |
| 3 | Expired forklift inspection blocks dispatch | Asset removed from dispatch pool, operator notified | ☐ |
| 4 | Hot Work permit expires mid-job | Job auto-paused, operator warned, fire watch alerted | ☐ |
| 5 | CAPA blocks related asset reuse | Asset blocked until CAPA closed, visible in dispatch | ☐ |
| 6 | Clearance requires EHS approval | Cannot clear without EHS role, escalation available | ☐ |
| 7 | Dispatch re-routes jobs automatically | Alternatives proposed, impact calculated, no auto-assign | ☐ |
| 8 | Attempted override is rejected | System refuses, logs attempt, alerts EHS | ☐ |
| 9 | Audit chain integrity verified | Hash chain unbroken, tampering detected | ☐ |
| 10 | Backdated clearance attempted | System rejects, current timestamp enforced | ☐ |

### 9.2 Integration Verification

| System | Integration Point | Status |
|--------|-------------------|--------|
| Dispatch Engine | Pre-assignment safety filter | ☐ |
| Job Lifecycle | STOPPED_BY_SAFETY state | ☐ |
| Work Center | Blocked status display | ☐ |
| Operator UI | Stop-Work banner | ☐ |
| Supervisor UI | Clearance workflow | ☐ |
| EHS Dashboard | Audit & analytics | ☐ |
| Safety AI Assistant | Auto-trigger & guidance | ☐ |
| Permit System | Expiration monitoring | ☐ |
| Inspection System | Overdue detection | ☐ |
| Training System | Qualification verification | ☐ |
| CAPA System | Asset linkage | ☐ |
| Audit System | Immutable logging | ☐ |

### 9.3 Security Validation

| Check | Requirement | Status |
|-------|-------------|--------|
| Role enforcement | Only authorized roles can clear | ☐ |
| No override path | System rejects all bypass attempts | ☐ |
| Audit immutability | Records cannot be modified | ☐ |
| Timestamp integrity | Server-side timestamps only | ☐ |
| Evidence verification | Files validated and stored | ☐ |
| Session tracking | All actions tied to authenticated user | ☐ |

---

## 10. API ENDPOINTS

### 10.1 Stop-Work Event Management

```typescript
// Initiate Stop-Work
POST /api/safety/stop-work
Body: {
  scopeType: SWAScopeType;
  scopeId: string;
  reasonCode: SWAReasonCode;
  severity: SWASeverity;
  description: string;
  immediateCause?: string;
  relatedPolicyId?: string;
}
Response: StopWorkEvent

// Get Active Stop-Work Events
GET /api/safety/stop-work/active
Query: { scopeType?, scopeId?, severity? }
Response: StopWorkEvent[]

// Get Stop-Work Event Details
GET /api/safety/stop-work/:id
Response: StopWorkEvent (with full audit trail)

// Update Stop-Work Status (with authorization check)
PATCH /api/safety/stop-work/:id/status
Body: {
  status: SWAStatus;
  notes?: string;
}
Response: StopWorkEvent

// Complete Clearance Step
POST /api/safety/stop-work/:id/steps/:stepId/complete
Body: {
  notes?: string;
  evidenceIds?: string[];
}
Response: SWAClearanceStep

// Upload Evidence
POST /api/safety/stop-work/:id/evidence
Body: FormData (file + metadata)
Response: SWAEvidence

// Request Clearance Approval
POST /api/safety/stop-work/:id/request-clearance
Response: StopWorkEvent

// Approve/Reject Clearance
POST /api/safety/stop-work/:id/clearance
Body: {
  action: 'APPROVE' | 'REJECT';
  notes: string;
}
Response: StopWorkEvent

// Get Audit Trail
GET /api/safety/stop-work/:id/audit
Response: SWAAuditEntry[]
```

### 10.2 Dispatch Integration

```typescript
// Check Assignment Safety
POST /api/dispatch/validate-assignment
Body: {
  jobId: string;
  workCenterId: string;
  operatorId: string;
  assetId?: string;
}
Response: {
  isValid: boolean;
  blocks: SafetyBlock[];
  warnings: SafetyWarning[];
}

// Get Blocked Resources
GET /api/dispatch/blocked-resources
Response: {
  jobs: string[];
  workCenters: string[];
  assets: string[];
  operators: string[];
  areas: string[];
}

// Get Alternate Routing Options
POST /api/dispatch/alternate-routes
Body: {
  jobId: string;
  blockedResourceId: string;
}
Response: AlternateRouting[]
```

---

## 11. IMPLEMENTATION PRIORITY

### Phase 1 — Core SWA Engine (Week 1-2)
- [ ] Database models
- [ ] Basic CRUD operations
- [ ] Audit logging
- [ ] Role authorization

### Phase 2 — Dispatch Integration (Week 2-3)
- [ ] Pre-assignment validation
- [ ] Blocked resource filtering
- [ ] Alternate routing suggestions
- [ ] UI status indicators

### Phase 3 — UI Components (Week 3-4)
- [ ] Operator Stop-Work banner
- [ ] Supervisor clearance workflow
- [ ] EHS dashboard
- [ ] Ops Manager impact view

### Phase 4 — AI Integration (Week 4-5)
- [ ] Auto-trigger rules
- [ ] AI response templates
- [ ] Clearance validation
- [ ] Conversational guidance

### Phase 5 — Testing & Hardening (Week 5-6)
- [ ] All test scenarios
- [ ] Security audit
- [ ] Performance testing
- [ ] Documentation

---

## 12. APPENDIX

### A. Reason Code to Clearance Mapping

| Reason Code | Default Clearance Steps |
|-------------|------------------------|
| MISSING_LOTO_PERMIT | Obtain permit, Verify energy isolation, Apply locks |
| EQUIPMENT_MALFUNCTION | Report to maintenance, Repair complete, Test operation |
| OPERATOR_TRAINING_EXPIRED | Schedule training, Complete course, Update records |
| OVERDUE_INSPECTION | Schedule inspection, Complete inspection, Address findings |
| GUARD_BYPASSED | Investigate cause, Restore guard, Verify interlock |

### B. Severity to SLA Mapping

| Severity | Max Active Duration | Escalation Trigger |
|----------|--------------------|--------------------|
| CRITICAL | 1 hour | Immediate EHS notification |
| HIGH | 4 hours | After 2 hours |
| MEDIUM | 24 hours | After 8 hours |
| LOW | 72 hours | After 24 hours |

### C. Notification Matrix

| Event | Operator | Supervisor | EHS | Ops Mgr | Maint |
|-------|----------|------------|-----|---------|-------|
| SWA Initiated | ✅ | ✅ | ✅ (HIGH+) | ✅ (HIGH+) | ✅ (Asset) |
| Clearance Needed | ❌ | ✅ | ✅ (MEDIUM+) | ❌ | ✅ (Asset) |
| SWA Cleared | ✅ | ✅ | ✅ | ✅ | ✅ (Asset) |
| SWA Escalated | ✅ | ✅ | ✅ | ✅ | ✅ |
| Override Attempted | ❌ | ✅ | ✅ | ✅ | ❌ |

---

**END OF DOCUMENT**
