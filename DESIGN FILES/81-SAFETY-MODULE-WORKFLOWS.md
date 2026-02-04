# 81-SAFETY-MODULE-WORKFLOWS.md
# Safety Module Specification - Part 2
## Workflows, UI/UX, and Roles & Permissions

---

================================================================================
# D) WORKFLOWS (STATE MACHINES)
================================================================================

## D.1 Incident Reporting & Investigation Workflow

### D.1.1 State Machine Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        INCIDENT WORKFLOW                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────┐    submit     ┌───────────┐   triage    ┌───────────┐          │
│  │ DRAFT  │──────────────►│ SUBMITTED │────────────►│  TRIAGED  │          │
│  │        │               │           │             │           │          │
│  └────────┘               └───────────┘             └─────┬─────┘          │
│       │                         │                         │                 │
│       │ auto-save               │ notify supervisor       │ assign          │
│       ▼                         │ notify EHS              │ investigator    │
│                                 ▼                         ▼                 │
│                                                    ┌──────────────┐         │
│                                                    │ INVESTIGATING│         │
│                                                    │              │         │
│                                                    └──────┬───────┘         │
│                                                           │                 │
│                                                           │ create CAPAs    │
│                                                           ▼                 │
│  ┌────────┐   verify     ┌────────────┐  assign   ┌──────────────┐         │
│  │ CLOSED │◄─────────────│ VERIFIED   │◄──────────│ CAPA_ASSIGNED│         │
│  │        │              │            │           │              │         │
│  └────────┘              └────────────┘           └──────────────┘         │
│       │                                                  │                  │
│       │                                                  │ CAPAs complete   │
│       ▼                                                  ▼                  │
│  (Archived)                                       ┌──────────────┐         │
│                                                   │CAPA_PROGRESS │         │
│  ┌─────────────────────────────────────────────►  │              │         │
│  │ reopen (new information)                       └──────────────┘         │
│  │                                                                          │
│  └──────────────────────────────────────────────────────────────────────────┤
└─────────────────────────────────────────────────────────────────────────────┘
```

### D.1.2 Transition Details

| From State | To State | Trigger | Actor Roles | Required Fields | Evidence | Notifications | Escalation |
|------------|----------|---------|-------------|-----------------|----------|---------------|------------|
| (new) | DRAFT | auto-create | Any User | type, locationId | - | - | - |
| DRAFT | SUBMITTED | submit | Reporter | occurredAt, description, immediateActions, affectedPersonType | Photos optional | Supervisor, EHS Specialist | - |
| SUBMITTED | TRIAGED | triage | EHS Specialist, Supervisor | severity, oshaRecordable, investigationRequired | - | Reporter (confirmation) | 4 hours if not triaged |
| TRIAGED | INVESTIGATING | assign_investigator | EHS Manager | leadInvestigatorId, dueDate | - | Lead Investigator, Team | - |
| INVESTIGATING | CAPA_ASSIGNED | complete_investigation | Lead Investigator | rootCauseDescription, findings[], recommendations[] | Investigation report | CAPA assignees, EHS Manager | Due date + 5 days |
| CAPA_ASSIGNED | CAPA_IN_PROGRESS | (auto) | System | - | - | - | - |
| CAPA_IN_PROGRESS | VERIFICATION | all_capas_implemented | System | All CAPAs in IMPLEMENTED | Implementation evidence | EHS Specialist | CAPA due dates |
| VERIFICATION | CLOSED | verify_effectiveness | EHS Manager | verificationNotes, effectivenessResult | Verification evidence | All stakeholders | 30 days if open |
| CLOSED | REOPENED | reopen | EHS Director | reopenReason | - | All stakeholders | - |

### D.1.3 OSHA Recordkeeping Integration

```typescript
interface OshaRecordkeeperRules {
  // Auto-determination based on treatment type
  determineRecordability(incident: Incident): OshaClassification {
    if (incident.injuryDetails?.treatmentType === 'FATALITY') {
      return OshaClassification.FATALITY;
      // CRITICAL: Notify OSHA within 8 hours
    }
    if (incident.injuryDetails?.treatmentType === 'HOSPITALIZATION') {
      return OshaClassification.DAYS_AWAY;
      // CRITICAL: Notify OSHA within 24 hours
    }
    if (incident.injuryDetails?.lostTimeStartDate) {
      return OshaClassification.DAYS_AWAY;
    }
    if (incident.injuryDetails?.workRestrictions?.length > 0) {
      return OshaClassification.RESTRICTED_TRANSFER;
    }
    if (incident.injuryDetails?.treatmentType === 'MEDICAL_TREATMENT') {
      return OshaClassification.RECORDABLE_OTHER;
    }
    return OshaClassification.NOT_RECORDABLE;
  }
}
```

### D.1.4 Integration Points

| Integration | Trigger | Action | Rollback |
|-------------|---------|--------|----------|
| Work Center Block | Severity = SEVERE or CATASTROPHIC | Block dispatch to affected work center | Resume after mitigation verified |
| Equipment Lock | Equipment involved + investigation pending | Set equipment.safetyStatus = OUT_OF_SERVICE_SAFETY | Return to service after CAPA verification |
| Training Assignment | Incident type matches training category | Auto-assign refresher training to affected employees | N/A |
| Maintenance Ticket | Equipment defect identified | Create maintenance work order | N/A |

---

## D.2 Inspection Workflow

### D.2.1 State Machine Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        INSPECTION WORKFLOW                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────┐   start    ┌─────────────┐  complete  ┌──────────────┐       │
│  │ SCHEDULED │───────────►│ IN_PROGRESS │───────────►│PENDING_REVIEW│       │
│  │           │            │             │            │              │       │
│  └─────┬─────┘            └─────────────┘            └──────┬───────┘       │
│        │                         │                          │               │
│        │ missed                  │ save progress            │ supervisor    │
│        ▼                         │ (auto-save)              │ approves      │
│  ┌───────────┐                   │                          ▼               │
│  │  OVERDUE  │                   │                   ┌──────────────┐       │
│  │           │                   │                   │  COMPLETED   │       │
│  └───────────┘                   │                   │              │       │
│        │                         │                   └──────┬───────┘       │
│        │ escalate                │                          │               │
│        ▼                         │                          │ has defects?  │
│  [Notify Branch Manager]         │                          ▼               │
│                                  │                   ┌──────────────┐       │
│                                  │                   │ DEFECTS_OPEN │       │
│                                  │                   │  (sub-state) │       │
│                                  │                   └──────┬───────┘       │
│                                  │                          │               │
│                                  │                          │ CAPAs closed  │
│                                  │                          ▼               │
│                                  │                   ┌──────────────┐       │
│                                  │                   │    CLOSED    │       │
│                                  │                   │              │       │
│                                  │                   └──────────────┘       │
│                                                                              │
│  ┌───────────┐                                                              │
│  │ CANCELLED │◄──────── cancel (with reason)                                │
│  └───────────┘                                                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### D.2.2 Transition Details

| From State | To State | Trigger | Actor Roles | Required Fields | Evidence | Notifications | Escalation |
|------------|----------|---------|-------------|-----------------|----------|---------------|------------|
| (new) | SCHEDULED | create_schedule | EHS Specialist, System | scheduledDate, templateId, inspectorId | - | Inspector (reminder) | - |
| SCHEDULED | IN_PROGRESS | start_inspection | Inspector | startedAt | Badge scan (kiosk) | - | - |
| SCHEDULED | OVERDUE | (auto) time passed | System | - | - | Inspector, Supervisor | 4 hours after scheduled |
| OVERDUE | IN_PROGRESS | start_inspection | Inspector | startedAt, lateStartReason | - | Supervisor notified | Branch Manager at 24h |
| IN_PROGRESS | PENDING_REVIEW | complete | Inspector | completedAt, responses[], inspectorSignature | All required photos | Supervisor | - |
| PENDING_REVIEW | COMPLETED | approve | Supervisor | supervisorReviewedAt | - | Inspector | - |
| COMPLETED | CLOSED | (auto) no defects | System | - | - | - | - |
| COMPLETED | DEFECTS_OPEN | (auto) has defects | System | - | - | CAPA owners | - |
| DEFECTS_OPEN | CLOSED | all_capas_closed | System | - | - | Inspector, Supervisor | CAPA due dates |

### D.2.3 Inspection Type Schedules

| Inspection Type | Frequency | Grace Period | Escalation | Equipment Impact |
|-----------------|-----------|--------------|------------|------------------|
| FORKLIFT_DAILY | Each shift before use | 30 minutes | Immediate supervisor | Cannot dispatch if missing |
| CRANE_MONTHLY | Monthly | 7 days | Branch Manager | Out of service if overdue |
| RIGGING_BEFORE_USE | Before each critical lift | 0 | Cannot proceed | Lift blocked |
| FIRE_EXTINGUISHER_MONTHLY | Monthly | 14 days | EHS Manager | Flag for compliance |
| EYEWASH_WEEKLY | Weekly | 3 days | Supervisor | Flag for compliance |
| FACILITY_WEEKLY | Weekly | 3 days | Branch Manager | - |
| MACHINE_GUARDING_WEEKLY | Weekly | 3 days | Supervisor | Flag equipment |
| LOTO_PERIODIC_ANNUAL | Annually per procedure | 30 days | EHS Director | Procedure invalid |

### D.2.4 Defect Severity & Response

| Defect Severity | Definition | Immediate Action | CAPA Required | Equipment Impact |
|-----------------|------------|------------------|---------------|------------------|
| CRITICAL | Imminent danger to life/health | Stop work, isolate equipment | Yes, 24h due | OUT_OF_SERVICE immediately |
| MAJOR | Significant safety risk | Restrict use pending fix | Yes, 7 days due | Flag, restricted use |
| MINOR | Low safety risk | Schedule repair | Yes, 30 days due | Continue with caution |
| OBSERVATION | Best practice improvement | Document for trend | Optional | None |

---

## D.3 Permit Workflow (Generic + Type-Specific)

### D.3.1 Generic Permit State Machine

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PERMIT WORKFLOW                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────┐  submit   ┌───────────────┐  review   ┌───────────────┐         │
│  │ DRAFT  │──────────►│PENDING_REVIEW │──────────►│PENDING_APPROVE│         │
│  │        │           │               │           │               │         │
│  └────────┘           └───────────────┘           └───────┬───────┘         │
│       │                      │                            │                 │
│       │                      │ return for                 │ approve         │
│       │                      │ corrections                ▼                 │
│       │                      └──────────────────►  ┌───────────────┐        │
│       │                                            │   APPROVED    │        │
│       │                                            │               │        │
│       │                                            └───────┬───────┘        │
│       │                                                    │                │
│       │                                                    │ activate       │
│       │                                                    ▼ (start work)   │
│       │                                            ┌───────────────┐        │
│       │                                            │    ACTIVE     │        │
│       │                                            │               │        │
│       │                                            └───────┬───────┘        │
│       │                                                    │                │
│       │          ┌─────────────┐                          │                │
│       │          │  SUSPENDED  │◄─────────────────────────┤ suspend        │
│       │          │             │                          │ (safety issue) │
│       │          └──────┬──────┘                          │                │
│       │                 │ resume                          │                │
│       │                 └─────────────────────────────────┤                │
│       │                                                   │                │
│       │                                                   │ complete work  │
│       │                                                   ▼                │
│       │                                            ┌───────────────┐        │
│       │                                            │  COMPLETED    │        │
│       │                                            │               │        │
│       │                                            └───────┬───────┘        │
│       │                                                    │                │
│       │                                                    │ closeout       │
│       │                                                    │ (post checks)  │
│       │                                                    ▼                │
│       │                                            ┌───────────────┐        │
│       │                                            │    CLOSED     │        │
│       │                                            │               │        │
│       │                                            └───────────────┘        │
│       │                                                                     │
│       │ cancel                                                              │
│       ▼                                                                     │
│  ┌───────────┐                                                              │
│  │ CANCELLED │                                                              │
│  └───────────┘                                                              │
│                                                                              │
│  ┌───────────┐                                                              │
│  │  EXPIRED  │◄─────────── (auto) validTo passed while APPROVED/ACTIVE      │
│  └───────────┘                                                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### D.3.2 LOTO Permit Specific Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    LOTO PERMIT ACTIVATION FLOW                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  APPROVED ──────────────────────────────────────────────────────────────►   │
│                                                                              │
│  1. PREPARE ISOLATION                                                        │
│     ├── Verify all authorized workers present                                │
│     ├── Each worker applies their lock                                       │
│     ├── Each lock application recorded (lockNumber, appliedAt, signature)    │
│     └── All tags applied                                                     │
│                                                                              │
│  2. VERIFY ZERO ENERGY                                                       │
│     ├── Try-start each energy source                                         │
│     ├── Record tryStartById, tryStartAt                                      │
│     ├── Each try-start requires signature                                    │
│     └── zeroEnergyVerified = true                                            │
│                                                                              │
│  3. ACTIVE (Work may proceed)                                                │
│     ├── Equipment status = LOCKED_OUT                                        │
│     ├── Dispatch blocked for equipment                                       │
│     └── Valid until validTo                                                  │
│                                                                              │
│  4. WORK COMPLETE                                                            │
│     ├── All authorized workers verify area clear                             │
│     ├── Each worker removes their lock (signature required)                  │
│     ├── All locks removed                                                    │
│     └── Tags removed                                                         │
│                                                                              │
│  5. RESTORE ENERGY                                                           │
│     ├── Notify affected employees                                            │
│     ├── Guards replaced                                                      │
│     ├── Controls restored                                                    │
│     └── Equipment energized                                                  │
│                                                                              │
│  6. CLOSEOUT                                                                 │
│     ├── Final signature by permit holder                                     │
│     ├── Supervisor closeout signature                                        │
│     └── Equipment status = SAFE                                              │
│                                                                              │
│  ────────────────────────────────────────────────────────────────► CLOSED    │
│                                                                              │
│  GROUP LOTO VARIATION:                                                       │
│  - Coordinator applies group lock box                                        │
│  - Each worker applies lock to group box                                     │
│  - Coordinator key controls energy isolation                                 │
│  - All workers must remove locks before coordinator can remove               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### D.3.3 Hot Work Permit Specific Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    HOT WORK PERMIT ACTIVATION FLOW                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  APPROVED ──────────────────────────────────────────────────────────────►   │
│                                                                              │
│  1. PRE-WORK AREA INSPECTION (within 30 min of work)                         │
│     ├── Fire extinguisher present and charged                                │
│     ├── Combustibles removed/covered (35 ft radius)                          │
│     ├── Floor swept, debris removed                                          │
│     ├── Wall/floor openings covered                                          │
│     ├── Sprinkler system active (or impairment permit)                       │
│     ├── Fire detection notified                                              │
│     └── areaInspectedById, areaInspected = true                              │
│                                                                              │
│  2. FIRE WATCH ASSIGNMENT                                                    │
│     ├── Trained fire watch assigned                                          │
│     ├── Fire watch trained on extinguisher use                               │
│     ├── Fire watch has communication device                                  │
│     └── fireWatchPersonId assigned                                           │
│                                                                              │
│  3. ACTIVE (Hot work may proceed)                                            │
│     ├── Fire watch continuous monitoring                                     │
│     ├── Fire watch log entries every 15 min                                  │
│     └── Valid until validTo (max 8 hours)                                    │
│                                                                              │
│  4. WORK COMPLETE                                                            │
│     ├── Hot work equipment secured                                           │
│     ├── Sparks/slag cooled                                                   │
│     └── completedAt recorded                                                 │
│                                                                              │
│  5. POST-WORK FIRE WATCH (30-60 min depending on policy)                     │
│     ├── Fire watch continues for postWorkMonitoringMinutes                   │
│     ├── Final area inspection                                                │
│     ├── No smoldering, hot spots                                             │
│     └── postWorkMonitoringById, postWorkMonitoringCompleted = true           │
│                                                                              │
│  6. CLOSEOUT                                                                 │
│     ├── Final fire watch signature                                           │
│     ├── Permit holder closeout                                               │
│     └── Supervisor verification                                              │
│                                                                              │
│  ────────────────────────────────────────────────────────────────► CLOSED    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### D.3.4 Permit Approval Matrix

| Permit Type | Level 1 Review | Level 2 Approval | Duration Limits | Renewal |
|-------------|---------------|------------------|-----------------|---------|
| LOTO | Supervisor | Maintenance Lead | Per job | New permit required |
| HOT_WORK | EHS Specialist | Supervisor | 8 hours max | Daily renewal |
| ELECTRICAL (de-energized) | Supervisor | Qualified Electrician | Per job | New permit |
| ELECTRICAL (energized) | EHS Manager | EHS Director + Manager | Per job | Not allowed |
| CONFINED_SPACE | Entry Supervisor | EHS Manager | 8 hours max | Daily renewal |
| CRITICAL_LIFT | Crane Supervisor | EHS Manager | Per lift | New permit |
| GUARD_BYPASS | EHS Specialist | EHS Manager | 4 hours max | New permit |

---

## D.4 Training Workflow

### D.4.1 State Machine Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        TRAINING ASSIGNMENT WORKFLOW                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐   accept   ┌─────────────┐  complete  ┌─────────────┐         │
│  │ ASSIGNED │───────────►│ IN_PROGRESS │───────────►│  COMPLETED  │         │
│  │          │            │             │            │             │         │
│  └────┬─────┘            └──────┬──────┘            └─────────────┘         │
│       │                         │                                           │
│       │                         │ requires                                  │
│       │                         │ practical?                                │
│       │                         ▼                                           │
│       │                  ┌─────────────────┐                                │
│       │                  │PENDING_PRACTICAL│                                │
│       │                  │                 │                                │
│       │                  └────────┬────────┘                                │
│       │                           │                                         │
│       │                           │ practical eval passed                   │
│       │                           ▼                                         │
│       │                  ┌─────────────────┐                                │
│       │                  │    COMPLETED    │                                │
│       │                  │                 │                                │
│       │                  └─────────────────┘                                │
│       │                                                                     │
│       │ due date passed                                                     │
│       ▼                                                                     │
│  ┌──────────┐                                                               │
│  │ OVERDUE  │                                                               │
│  │          │                                                               │
│  └────┬─────┘                                                               │
│       │                                                                     │
│       │ escalation timer                                                    │
│       ▼                                                                     │
│  ┌──────────┐                                                               │
│  │ESCALATED │───────────► Supervisor notified, operations blocked           │
│  │          │                                                               │
│  └──────────┘                                                               │
│                                                                             │
│  ┌──────────┐                                                               │
│  │  WAIVED  │◄──────────── EHS Manager waiver with reason                   │
│  └──────────┘                                                               │
│                                                                             │
│  ══════════════════════════════════════════════════════════════════════════ │
│                                                                             │
│  EXPIRATION FLOW (for certifications):                                      │
│                                                                             │
│  COMPLETED ──► (expiresAt - 90 days) ──► Reminder sent                      │
│            ──► (expiresAt - 30 days) ──► New assignment created             │
│            ──► (expiresAt passed)    ──► Status = EXPIRED                   │
│            ──► Operations blocked for associated equipment/tasks            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### D.4.2 Training Trigger Events

| Trigger | Source | Training Assigned | Due Date | Auto/Manual |
|---------|--------|-------------------|----------|-------------|
| NEW_HIRE | User.createdAt | Orientation package | Start + 7 days | Auto |
| ROLE_CHANGE | UserRole assignment | Role-required courses | Change + 14 days | Auto |
| LOCATION_CHANGE | Location assignment | Location-specific courses | Change + 14 days | Auto |
| EQUIPMENT_ACCESS | Work center assignment | Equipment certifications | Assignment + 30 days | Auto |
| RECERTIFICATION | TrainingCompletion.expiresAt | Same course | Expiry - 30 days | Auto |
| INCIDENT | Incident affecting user | Refresher training | Incident + 7 days | Auto |
| AUDIT_FINDING | Audit with training gap | Specified courses | Finding + 14 days | Manual |
| POLICY_UPDATE | PolicyDocument published | Policy acknowledgement | Publish + 14 days | Auto |
| EQUIPMENT_CHANGE | New equipment installed | Equipment-specific | Install + 30 days | Auto |

### D.4.3 Escalation Timers

| Days Overdue | Action | Recipient |
|--------------|--------|-----------|
| 0 (due date) | Reminder email | Employee |
| 3 | Escalation email | Employee + Supervisor |
| 7 | Dashboard alert | Supervisor + Ops Manager |
| 14 | Operations restriction | System blocks access |
| 21 | Management report | Branch Manager |
| 30 | Executive report | EHS Director |

### D.4.4 Operations Impact

```typescript
interface TrainingGateCheck {
  // Called before equipment use / work center access
  async canPerformWork(userId: string, context: WorkContext): Promise<GateResult> {
    const requirements = await this.getRequirements(context);
    const completions = await this.getUserCompletions(userId);
    
    const gaps = requirements.filter(req => {
      const completion = completions.find(c => c.courseId === req.courseId);
      if (!completion) return true;
      if (completion.status === 'EXPIRED') return true;
      if (req.requiresPractical && !completion.practicalEvalPassed) return true;
      return false;
    });
    
    return {
      allowed: gaps.length === 0,
      gaps: gaps.map(g => ({
        courseId: g.courseId,
        courseName: g.title,
        reason: this.getGapReason(g, completions)
      }))
    };
  }
}
```

---

## D.5 Stop Work Authority Workflow

### D.5.1 State Machine

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     STOP WORK AUTHORITY WORKFLOW                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ANY EMPLOYEE can issue Stop Work at any time                                │
│                                                                              │
│  ┌────────┐                                                                  │
│  │ ISSUED │────────────────────────────────────────────────────►            │
│  │        │    Immediate notifications:                                      │
│  └────┬───┘    - Work center stopped                                         │
│       │        - Supervisor alerted                                          │
│       │        - EHS notified                                                │
│       │        - Equipment flagged                                           │
│       │                                                                      │
│       │ supervisor acknowledges (required within 15 min)                     │
│       ▼                                                                      │
│  ┌──────────────┐                                                            │
│  │ ACKNOWLEDGED │                                                            │
│  │              │                                                            │
│  └──────┬───────┘                                                            │
│         │                                                                    │
│         │ mitigation actions identified                                      │
│         ▼                                                                    │
│  ┌──────────────────────┐                                                    │
│  │ MITIGATION_IN_PROGRESS│                                                   │
│  │                      │                                                    │
│  └──────────┬───────────┘                                                    │
│             │                                                                │
│             │ mitigation completed                                           │
│             ▼                                                                │
│  ┌──────────────────────┐                                                    │
│  │ MITIGATION_COMPLETE  │                                                    │
│  │                      │                                                    │
│  └──────────┬───────────┘                                                    │
│             │                                                                │
│             │ EHS/Supervisor verifies, authorizes resume                     │
│             ▼                                                                │
│  ┌──────────────────────┐                                                    │
│  │   RESUME_AUTHORIZED  │                                                    │
│  │                      │                                                    │
│  └──────────┬───────────┘                                                    │
│             │                                                                │
│             │ work resumes, documentation complete                           │
│             ▼                                                                │
│  ┌──────────────────────┐                                                    │
│  │        CLOSED        │                                                    │
│  │                      │                                                    │
│  └──────────────────────┘                                                    │
│                                                                              │
│  KEY PRINCIPLE: No retaliation. All Stop Work events tracked.               │
│  Positive reinforcement for exercising SWA.                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### D.5.2 Stop Work Authorities

| Actor | Authority | Resume Authorization |
|-------|-----------|---------------------|
| Any Employee | Issue for imminent danger | N/A |
| Operator | Issue for unsafe equipment | N/A |
| Supervisor | Issue, acknowledge, mitigate | Authorize resume (non-imminent) |
| EHS Specialist | Issue, investigate, verify | Authorize resume (all) |
| EHS Manager | Issue, override | Authorize resume (all) |

---

## D.6 CAPA Workflow

### D.6.1 State Machine

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CAPA WORKFLOW                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────┐  assign    ┌──────────┐  start   ┌─────────────┐                │
│  │ DRAFT  │───────────►│ ASSIGNED │─────────►│ IN_PROGRESS │                │
│  │        │            │          │          │             │                │
│  └────────┘            └──────────┘          └──────┬──────┘                │
│                                                     │                        │
│                                                     │ implement              │
│                                                     ▼                        │
│                                            ┌───────────────────┐             │
│                                            │PENDING_VERIFICATION│            │
│                                            │                   │             │
│                                            └─────────┬─────────┘             │
│                                                      │                       │
│                                                      │ verify                │
│                                                      ▼                       │
│              ┌───────────────────────────────────────┼────────────────────┐  │
│              │                                       │                    │  │
│              ▼ Not Effective                         ▼ Effective          │  │
│  ┌───────────────────┐                    ┌───────────────────────┐       │  │
│  │ REQUIRES_REVISION │                    │       VERIFIED        │       │  │
│  │                   │                    │                       │       │  │
│  └─────────┬─────────┘                    └───────────┬───────────┘       │  │
│            │                                          │                   │  │
│            │ revise                                   │ effectiveness     │  │
│            ▼                                          │ review (optional) │  │
│  ┌───────────────────┐                               ▼                   │  │
│  │   IN_PROGRESS     │                    ┌───────────────────────┐       │  │
│  │ (new due date)    │                    │PENDING_EFFECTIVENESS  │       │  │
│  └───────────────────┘                    │                       │       │  │
│                                           └───────────┬───────────┘       │  │
│                                                       │                   │  │
│                                                       │ confirm effective │  │
│                                                       ▼                   │  │
│                                           ┌───────────────────────┐       │  │
│                                           │        CLOSED         │       │  │
│                                           │                       │       │  │
│                                           └───────────────────────┘       │  │
│                                                                           │  │
│  ══════════════════════════════════════════════════════════════════════  │  │
│                                                                           │  │
│  ESCALATION:                                                              │  │
│  - Overdue 7 days → Supervisor notified                                   │  │
│  - Overdue 14 days → Ops Manager notified, status = ESCALATED             │  │
│  - Overdue 30 days → Branch Manager notified                              │  │
│  - Overdue 45 days → EHS Director, executive dashboard                    │  │
│                                                                           │  │
│  EXTENSION:                                                               │  │
│  - Max 2 extensions allowed                                               │  │
│  - Requires Manager approval                                              │  │
│  - Extension reason mandatory                                             │  │
│                                                                           │  │
└───────────────────────────────────────────────────────────────────────────┘
```

---

================================================================================
# E) UI/UX (MATERIAL UI) + TASK LENSES
================================================================================

## E.1 Safety Module Navigation Structure

```
📁 Safety
├── 🏠 Safety Home (Dashboard/Cockpit)
├── 🔔 My Safety Tasks
├── ⚠️ Incidents
│   ├── Report Incident
│   ├── My Incidents
│   ├── All Incidents
│   ├── Investigations
│   └── OSHA Log
├── ✅ CAPA Center
│   ├── My CAPAs
│   ├── All CAPAs
│   └── Verification Queue
├── 📋 Inspections
│   ├── My Inspections
│   ├── Inspection Schedule
│   ├── Templates
│   └── Equipment Inspections
├── 📝 Permits
│   ├── Request Permit
│   ├── My Permits
│   ├── Active Permits
│   ├── Approval Queue
│   └── Permit Types
│       ├── LOTO
│       ├── Hot Work
│       ├── Electrical
│       └── Confined Space
├── 🎓 Training
│   ├── My Training
│   ├── Training Catalog
│   ├── Assignments
│   ├── Certifications
│   └── Compliance Report
├── 📚 Policies & Procedures
│   ├── Policy Library
│   ├── My Acknowledgements
│   └── Signoff Dashboard
├── ⚗️ SDS Library
│   ├── Search SDS
│   ├── By Location
│   └── Upload SDS
├── 🔧 Equipment Safety
│   ├── Equipment Register
│   ├── LOTO Procedures
│   ├── Out of Service
│   └── Arc Flash Labels
├── 👁️ Observations
│   ├── Submit Observation
│   ├── Observation Trends
│   └── Recognition
├── 🗣️ Toolbox Talks
│   ├── Schedule Talk
│   ├── Upcoming
│   └── Attendance History
├── 📊 Audits
│   ├── Audit Schedule
│   ├── Audit Findings
│   └── Management Review
├── 📈 Reports & KPIs
│   ├── Safety Scorecard
│   ├── TRIR Dashboard
│   ├── Leading Indicators
│   ├── Trend Analysis
│   └── Regulatory Reports
└── ⚙️ Safety Admin
    ├── Inspection Templates
    ├── Training Courses
    ├── PPE Matrix
    ├── Contractor Management
    └── System Configuration
```

## E.2 Task Lenses (Smart Views)

### E.2.1 "What Needs My Attention?" Lens

```typescript
interface AttentionLensData {
  approvalsPending: {
    permits: PermitSummary[];      // Permits awaiting my approval
    incidents: IncidentSummary[];   // Incidents needing triage/investigation
    policies: PolicySummary[];      // Policies awaiting signoff
  };
  myTasks: {
    capasAssigned: CapaSummary[];   // CAPAs assigned to me
    inspectionsDue: InspectionSummary[];
    trainingOverdue: TrainingSummary[];
  };
  escalations: {
    overdueItems: EscalationItem[];  // Items escalated to my level
  };
}
```

**UI Component: AttentionDashboard**
```
┌─────────────────────────────────────────────────────────────────────────┐
│ 🔔 Needs Your Attention                                    [View All]   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ⏳ APPROVALS PENDING (5)                                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 🔥 Hot Work Permit #HW-2026-0042    Bay 3 Welding    [Approve]  │   │
│  │    Requested: John Smith · 15 min ago                           │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │ 🔒 LOTO Permit #LT-2026-0089        Saw #4 Maint     [Review]   │   │
│  │    Requested: Mike Johnson · 1 hour ago                         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  📋 MY TASKS DUE TODAY (3)                                             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ☐ CAPA-2026-0015: Install guard on Router #2       Due: Today   │   │
│  │ ☐ Forklift Daily Inspection (FL-003)               Due: 8:00 AM │   │
│  │ ☐ Complete Hazcom Refresher Training               Due: Today   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  🚨 ESCALATED TO YOU (1)                                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ⚠️ Training Overdue: Tom Brown - Forklift Cert                  │   │
│  │    21 days overdue · Forklift operations blocked                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### E.2.2 "What is Overdue?" Lens

```typescript
interface OverdueLensData {
  inspections: {
    critical: InspectionOverdue[];   // Safety-critical overdue
    standard: InspectionOverdue[];   // Standard overdue
  };
  training: {
    expired: TrainingExpired[];      // Certifications expired
    overdue: TrainingOverdue[];      // Assignments past due
  };
  capas: {
    overdue: CapaOverdue[];
    escalated: CapaOverdue[];
  };
  policyAcks: PolicyAckOverdue[];
  equipmentInspections: EquipmentInspectionOverdue[];
}
```

**UI Component: OverdueDashboard**
```
┌─────────────────────────────────────────────────────────────────────────┐
│ ⏰ Overdue Items                                    [Export] [Escalate] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Filters: [Location ▼] [Type ▼] [Severity ▼] [Owner ▼]                 │
│                                                                         │
│  🔴 CRITICAL (3)                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Crane Monthly Inspection    Crane #2    7 days overdue          │   │
│  │ Owner: John Doe    Impact: Crane OUT OF SERVICE                 │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │ LOTO Procedure Review      Shear #1    32 days overdue          │   │
│  │ Owner: EHS Team    Impact: Procedure INVALID                    │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │ Forklift Certification     Bob Wilson  21 days expired          │   │
│  │ Owner: Training Dept  Impact: Cannot operate forklift           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  🟡 STANDARD (12)                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Type          Item                  Days    Owner    [Actions]  │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │ CAPA          Install safety mat    5       J.Smith  [Extend]   │   │
│  │ Training      HazCom Refresher      3       T.Jones  [Remind]   │   │
│  │ Policy Ack    LOTO Program v2.1     7       (12 ppl) [Bulk]     │   │
│  │ Inspection    Fire Ext Monthly      2       M.Brown  [Assign]   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### E.2.3 "What is Unsafe Right Now?" Lens

```typescript
interface UnsafeRightNowData {
  activeStopWork: StopWorkEvent[];
  equipmentOutOfService: EquipmentAsset[];  // safetyStatus = OUT_OF_SERVICE_SAFETY
  activePermits: Permit[];                   // Currently active high-risk permits
  openCriticalDefects: InspectionDefect[];   // Severity = CRITICAL
  blockedWorkCenters: WorkCenter[];          // Due to safety issues
  suspendedPermits: Permit[];                // Permits in SUSPENDED state
  immediateDangerIncidents: Incident[];      // Recent severe incidents
}
```

**UI Component: SafetyStatusBoard**
```
┌─────────────────────────────────────────────────────────────────────────┐
│ 🚨 Real-Time Safety Status                           [Auto-refresh: ON] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  🛑 STOP WORK ACTIVE (1)                                                │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ⛔ Bay 4 - Material Handling Area                                │   │
│  │    Issued by: Jane Smith · 10 min ago                           │   │
│  │    Reason: Overhead crane cable fraying observed                 │   │
│  │    Status: ACKNOWLEDGED - Awaiting crane inspection              │   │
│  │    [View Details] [Track Mitigation]                            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  🔒 ACTIVE PERMITS (3)                     🔧 EQUIPMENT OUT OF SERVICE  │
│  ┌─────────────────────────────────┐      ┌────────────────────────┐   │
│  │ 🔥 HW-0042 · Bay 3 Welding     │      │ ⚠️ Crane #2 (CR-002)   │   │
│  │    Valid until: 4:30 PM        │      │    Cable inspection    │   │
│  ├─────────────────────────────────┤      ├────────────────────────┤   │
│  │ 🔒 LT-0089 · Saw #4            │      │ ⚠️ Forklift #5 (FL-005)│   │
│  │    Valid until: 2:00 PM        │      │    Brake issue         │   │
│  ├─────────────────────────────────┤      ├────────────────────────┤   │
│  │ ⚡ EL-0033 · Panel B           │      │ ⚠️ Shear #2 (SH-002)   │   │
│  │    Valid until: 5:00 PM        │      │    Guard damage        │   │
│  └─────────────────────────────────┘      └────────────────────────┘   │
│                                                                         │
│  ⚡ CRITICAL DEFECTS OPEN (2)                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Shear #2: Safety guard damaged - Reported 2 hours ago           │   │
│  │ Router #1: Emergency stop malfunction - Reported yesterday       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### E.2.4 "Today's Inspections" Lens

```typescript
interface TodaysInspectionsData {
  scheduled: Inspection[];
  inProgress: Inspection[];
  completed: Inspection[];
  overdue: Inspection[];         // Should have been done by now
  upcoming: Inspection[];        // Next 24 hours
}
```

### E.2.5 "Expiring Training" Lens

```typescript
interface ExpiringTrainingData {
  expiredThisWeek: TrainingCompletion[];
  expiringIn30Days: TrainingCompletion[];
  expiringIn60Days: TrainingCompletion[];
  expiringIn90Days: TrainingCompletion[];
  byDepartment: Record<string, TrainingCompletion[]>;
  byTrainingType: Record<string, TrainingCompletion[]>;
}
```

### E.2.6 "Open Incidents & CAPA Status" Lens

```typescript
interface OpenIncidentsCapaData {
  incidents: {
    openByStatus: Record<IncidentStatus, Incident[]>;
    byLocation: Record<string, Incident[]>;
    bySeverity: Record<IncidentSeverity, Incident[]>;
    avgDaysOpen: number;
    oldestOpen: Incident;
  };
  capas: {
    openByStatus: Record<CapaStatus, CorrectiveAction[]>;
    byPriority: Record<Priority, CorrectiveAction[]>;
    overdueCount: number;
    avgDaysToClose: number;
    verificationPending: CorrectiveAction[];
  };
}
```

## E.3 Page Specifications

### E.3.1 Safety Home (Safety Cockpit)

**Purpose**: Executive/manager view of safety program health

**Components**:
- Safety Scorecard Summary (TRIR, DART, leading indicators)
- Incident/Near-Miss Trend Chart (12 months)
- Open Items Summary (Incidents, CAPAs, Overdue Training)
- Active Permits Map/List
- Equipment Status Summary
- Recent Activity Feed
- Quick Actions (Report Incident, Start Inspection, etc.)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🏠 Safety Cockpit                                    Branch: [All ▼]        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌────────────┐│
│  │ TRIR (YTD)      │ │ Days Since Last │ │ Open CAPAs      │ │ Training   ││
│  │     1.24        │ │ Recordable      │ │     23          │ │ Compliance ││
│  │ ▼ 0.15 vs last │ │     127         │ │ 5 overdue       │ │    94%     ││
│  │     year        │ │                 │ │                 │ │ ▲ 2%      ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ └────────────┘│
│                                                                             │
│  ┌────────────────────────────────────────┐ ┌──────────────────────────────┐│
│  │ Incident Trend (12 Months)             │ │ Open Items by Type           ││
│  │                                        │ │                              ││
│  │  ▓▓                                    │ │ Incidents     ████████ 8    ││
│  │  ▓▓ ▓▓                                 │ │ CAPAs         ██████████ 23 ││
│  │  ▓▓ ▓▓ ▓▓    ▓▓                        │ │ Overdue Train █████ 12      ││
│  │  ▓▓ ▓▓ ▓▓ ▓▓ ▓▓ ▓▓ ▓▓ ▓▓ ▓▓ ▓▓ ▓▓ ▓▓  │ │ Overdue Insp  ███ 6         ││
│  │  J  F  M  A  M  J  J  A  S  O  N  D    │ │ Policy Acks   ████ 15       ││
│  │  ■ Recordable ■ Near Miss ■ First Aid  │ │                              ││
│  └────────────────────────────────────────┘ └──────────────────────────────┘│
│                                                                             │
│  ┌────────────────────────────────────────┐ ┌──────────────────────────────┐│
│  │ 🔔 Attention Required                  │ │ Quick Actions                ││
│  │                                        │ │                              ││
│  │ • 2 permits awaiting approval          │ │ [➕ Report Incident]         ││
│  │ • 1 active Stop Work event             │ │ [📋 Start Inspection]        ││
│  │ • 3 CAPAs overdue                      │ │ [📝 Request Permit]          ││
│  │ • Training: 5 employees overdue        │ │ [👁️ Log Observation]        ││
│  │                                        │ │ [🗣️ Record Toolbox Talk]    ││
│  └────────────────────────────────────────┘ └──────────────────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### E.3.2 Incident Center

**Purpose**: Central hub for incident reporting, tracking, investigation

**Sub-pages**:
1. **Report Incident** - Guided form with photos
2. **My Incidents** - Incidents I reported or am involved in
3. **All Incidents** - List view with filters (role-based visibility)
4. **Investigation Dashboard** - For investigators
5. **OSHA Log** - 300/300A/301 views

**Report Incident Form Flow**:
```
Step 1: Basic Information
├── What happened? (description)
├── When? (date/time)
├── Where? (location picker, work center)
└── Who was involved? (person type, name)

Step 2: Classification
├── Incident type (Injury, Near Miss, Property, etc.)
├── If injury: body part, nature of injury
├── Treatment received
└── Was work stopped?

Step 3: Evidence
├── Photos (camera or upload)
├── Witness information
└── Equipment involved

Step 4: Immediate Actions
├── What was done immediately?
├── Supervisor notified?
└── Area secured?

Step 5: Review & Submit
├── Review all information
├── Attestation checkbox
└── Electronic signature
```

### E.3.3 CAPA Center

**Purpose**: Track corrective and preventive actions to closure

**Components**:
- CAPA List with filters (status, priority, owner, source, due date)
- CAPA Detail View (full information, evidence, history)
- My CAPAs View (assigned to me)
- Verification Queue (for verifiers)
- CAPA Metrics (avg close time, overdue rate, by source)

### E.3.4 Inspections

**Purpose**: Schedule, conduct, and track inspections

**Sub-pages**:
1. **Inspection Schedule** - Calendar/list view
2. **My Inspections** - Assigned to me
3. **Conduct Inspection** - Mobile-friendly checklist
4. **Inspection Results** - View completed inspections
5. **Templates** - Manage inspection templates (admin)

**Mobile Inspection Interface**:
```
┌─────────────────────────────────────────┐
│ 📋 Forklift Daily Inspection            │
│ FL-003 · John Smith · 2026-02-03        │
├─────────────────────────────────────────┤
│                                         │
│ Section 1: Operator Compartment   [3/5] │
│                                         │
│ ☑️ 1. Seat belt functional?             │
│    ● Yes ○ No                           │
│                                         │
│ ☑️ 2. Horn operational?                 │
│    ● Yes ○ No                           │
│                                         │
│ ☐ 3. Backup alarm working?              │
│    ○ Yes ○ No ○ N/A                     │
│    💬 Add comment                       │
│    📷 Add photo                         │
│                                         │
│ ☐ 4. Overhead guard secure?             │
│    ○ Yes ○ No                           │
│                                         │
│ ☐ 5. Fire extinguisher present/charged? │
│    ○ Yes ○ No                           │
│    📷 Required if No                    │
│                                         │
├─────────────────────────────────────────┤
│        [Previous]    [Next Section]     │
│                                         │
│  Progress: ████████░░░░░░░░░░░ 40%      │
└─────────────────────────────────────────┘
```

### E.3.5 Permits

**Purpose**: Request, approve, track permits

**Permit Request Flow (LOTO Example)**:
```
Step 1: Work Description
├── Equipment to be locked out (asset picker)
├── Work to be performed
├── Authorized workers (multi-select)
└── Estimated duration

Step 2: Energy Sources (pre-populated from equipment)
├── Review equipment energy sources
├── Confirm isolation points
├── Add any additional energy sources
└── Review LOTO procedure

Step 3: JHA Review/Create
├── Link existing JHA -or- Create new JHA
├── Review hazards and controls
└── Confirm PPE requirements

Step 4: Signoffs
├── Requester attestation
├── Worker acknowledgement (each worker)
└── Submit for approval

[Submitted → Reviewed by Supervisor → Approved]
```

**Active Permits Dashboard**:
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 📝 Active Permits                                    [+ New Permit Request] │
├─────────────────────────────────────────────────────────────────────────────┤
│ Filters: [Type ▼] [Location ▼] [Status ▼]                                  │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ 🔒 LOTO Permit #LT-2026-0089                                 ACTIVE     ││
│ │ ─────────────────────────────────────────────────────────────────────── ││
│ │ Equipment: Band Saw #4 (BS-004)                                         ││
│ │ Work: Replace blade and adjust guide                                    ││
│ │ Holder: Mike Johnson                                                    ││
│ │ Workers: Mike Johnson, Tom Smith                                        ││
│ │ Valid: 8:00 AM - 2:00 PM (5h 32m remaining)                            ││
│ │                                                                         ││
│ │ Isolation Points:    Lock Status:                                       ││
│ │ ● Main Breaker CB-4  🔒 MJ-Lock-12 applied                             ││
│ │ ● Pneumatic Valve V3 🔒 MJ-Lock-13 applied                             ││
│ │                                                                         ││
│ │ [View Details] [Extend] [Complete Work] [Emergency Cancel]              ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ 🔥 Hot Work Permit #HW-2026-0042                             ACTIVE     ││
│ │ ─────────────────────────────────────────────────────────────────────── ││
│ │ Location: Bay 3 - Frame Welding Area                                    ││
│ │ Work: Structural welding on order #12345                                ││
│ │ Holder: Jane Welder                                                     ││
│ │ Fire Watch: Bob Safety                                                  ││
│ │ Valid: 10:00 AM - 4:30 PM (2h 45m remaining)                           ││
│ │                                                                         ││
│ │ Fire Watch Log: Last entry 10 min ago ✓                                ││
│ │                                                                         ││
│ │ [View Details] [Fire Watch Entry] [Complete Work]                       ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### E.3.6 Training Center

**Components**:
- My Training Dashboard (assigned, in-progress, completed, expiring)
- Training Catalog (browse/search courses)
- Course Player (for online courses)
- Certification Wallet (my active certifications)
- Training Matrix (admin view - who needs what)
- Compliance Report (by department, location, course)

### E.3.7 SDS Library

**Components**:
- Search Interface (product name, manufacturer, CAS#)
- Quick Access (recently viewed, by location)
- SDS Viewer (embedded PDF)
- PPE Guidance (from SDS data)
- Emergency Information Panel
- Upload/Manage (EHS admin)

### E.3.8 Equipment Safety

**Components**:
- Equipment Register (list with safety status)
- Equipment Detail (LOTO procedure, inspections, permits, incidents)
- LOTO Procedure Library
- Arc Flash Labels
- Out-of-Service Equipment List
- Return to Service Workflow

## E.4 Floor-Friendly UIs

### E.4.1 Kiosk Mode

**Entry Point**: Badge scan or PIN entry

**Main Menu (Large Touch Targets)**:
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        🏭 Safety Kiosk                                      │
│                        Branch: Cleveland                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│    ┌───────────────────────┐     ┌───────────────────────┐                 │
│    │                       │     │                       │                 │
│    │    📋                 │     │    📝                 │                 │
│    │    START              │     │    REQUEST            │                 │
│    │    INSPECTION         │     │    PERMIT             │                 │
│    │                       │     │                       │                 │
│    └───────────────────────┘     └───────────────────────┘                 │
│                                                                             │
│    ┌───────────────────────┐     ┌───────────────────────┐                 │
│    │                       │     │                       │                 │
│    │    ⚠️                 │     │    🗣️                 │                 │
│    │    REPORT             │     │    TOOLBOX            │                 │
│    │    INCIDENT           │     │    TALK               │                 │
│    │                       │     │                       │                 │
│    └───────────────────────┘     └───────────────────────┘                 │
│                                                                             │
│    ┌───────────────────────┐     ┌───────────────────────┐                 │
│    │                       │     │                       │                 │
│    │    📚                 │     │    🔧                 │                 │
│    │    VIEW               │     │    SCAN               │                 │
│    │    SDS                │     │    EQUIPMENT          │                 │
│    │                       │     │                       │                 │
│    └───────────────────────┘     └───────────────────────┘                 │
│                                                                             │
│                    [🪪 Badge ID: John Smith]                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### E.4.2 QR/RFID Equipment Scan Flow

**Scan Result Actions**:
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    🔧 Equipment: Forklift FL-003                            │
│                       Status: ✅ OPERATIONAL                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│    ┌───────────────────────┐     ┌───────────────────────┐                 │
│    │    📋                 │     │    📜                 │                 │
│    │    DAILY              │     │    VIEW               │                 │
│    │    INSPECTION         │     │    LOTO PROCEDURE     │                 │
│    └───────────────────────┘     └───────────────────────┘                 │
│                                                                             │
│    ┌───────────────────────┐     ┌───────────────────────┐                 │
│    │    📝                 │     │    📊                 │                 │
│    │    REQUEST            │     │    INSPECTION         │                 │
│    │    PERMIT             │     │    HISTORY            │                 │
│    └───────────────────────┘     └───────────────────────┘                 │
│                                                                             │
│    ┌───────────────────────┐     ┌───────────────────────┐                 │
│    │    ⚠️                 │     │    🔒                 │                 │
│    │    REPORT             │     │    LOCK               │                 │
│    │    DEFECT             │     │    OUT                │                 │
│    └───────────────────────┘     └───────────────────────┘                 │
│                                                                             │
│  Last Inspection: Today 6:00 AM by Bob Smith ✓                             │
│  Active Permits: None                                                       │
│  Training Required: Forklift Operator Certification ✓                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

================================================================================
# F) ROLES & PERMISSIONS
================================================================================

## F.1 Safety-Specific Roles

### F.1.1 Role Definitions

| Role | Scope | Description |
|------|-------|-------------|
| EHS_DIRECTOR | Tenant | Enterprise safety leader, full system access |
| EHS_MANAGER | Location/Division | Site or regional safety manager |
| EHS_SPECIALIST | Location | Day-to-day safety program execution |
| EHS_COORDINATOR | Location | Part-time safety coordination (may be shared role) |
| BRANCH_MANAGER | Location | Full location authority including safety |
| OPS_MANAGER | Location | Operations with safety oversight |
| PRODUCTION_MANAGER | Location | Production with safety oversight |
| SUPERVISOR | WorkCenter | Work center supervisory authority |
| MAINTENANCE_LEAD | Location | Maintenance team lead, equipment authority |
| MAINTENANCE_TECH | Location | Maintenance technician |
| OPERATOR | WorkCenter | Equipment operator |
| WAREHOUSE_STAFF | Location | Inventory, receiving, shipping |
| CONTRACTOR | Location | External contractor worker |
| VISITOR | Location | Visitor with limited access |
| SAFETY_AUDITOR | Tenant/Location | Read-only audit access |
| TRAINER | Location | Training administration |

### F.1.2 Permission Matrix - Incidents

| Permission | EHS_DIRECTOR | EHS_MANAGER | EHS_SPECIALIST | BRANCH_MANAGER | OPS_MANAGER | SUPERVISOR | OPERATOR |
|------------|:------------:|:-----------:|:--------------:|:--------------:|:-----------:|:----------:|:--------:|
| incident.create | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| incident.view_own | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| incident.view_location | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | - |
| incident.view_all | ✓ | ✓ | ✓ | - | - | - | - |
| incident.update | ✓ | ✓ | ✓ | - | - | - | - |
| incident.triage | ✓ | ✓ | ✓ | - | - | ✓ | - |
| incident.assign_investigator | ✓ | ✓ | - | - | - | - | - |
| incident.investigate | ✓ | ✓ | ✓ | - | - | - | - |
| incident.close | ✓ | ✓ | - | - | - | - | - |
| incident.reopen | ✓ | - | - | - | - | - | - |
| incident.osha_classify | ✓ | ✓ | - | - | - | - | - |
| incident.delete | ✓ | - | - | - | - | - | - |

### F.1.3 Permission Matrix - Permits

| Permission | EHS_DIRECTOR | EHS_MANAGER | EHS_SPECIALIST | SUPERVISOR | MAINT_LEAD | OPERATOR |
|------------|:------------:|:-----------:|:--------------:|:----------:|:----------:|:--------:|
| permit.request_loto | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (if authorized) |
| permit.approve_loto | ✓ | ✓ | - | ✓ | ✓ | - |
| permit.request_hotwork | ✓ | ✓ | ✓ | ✓ | - | ✓ (if trained) |
| permit.approve_hotwork | ✓ | ✓ | ✓ | ✓ | - | - |
| permit.request_electrical | ✓ | ✓ | ✓ | ✓ | ✓ | - |
| permit.approve_electrical | ✓ | ✓ | - | - | - | - |
| permit.approve_energized | ✓ | ✓ | - | - | - | - |
| permit.request_confined | ✓ | ✓ | ✓ | ✓ | - | - |
| permit.approve_confined | ✓ | ✓ | - | - | - | - |
| permit.suspend | ✓ | ✓ | ✓ | ✓ | - | - |
| permit.cancel | ✓ | ✓ | ✓ | - | - | - |

### F.1.4 Permission Matrix - Inspections

| Permission | EHS_DIRECTOR | EHS_MANAGER | EHS_SPECIALIST | SUPERVISOR | MAINT_LEAD | OPERATOR |
|------------|:------------:|:-----------:|:--------------:|:----------:|:----------:|:--------:|
| inspection.create_schedule | ✓ | ✓ | ✓ | - | - | - |
| inspection.perform | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (assigned) |
| inspection.review | ✓ | ✓ | ✓ | ✓ | ✓ | - |
| inspection.create_defect | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| inspection.create_template | ✓ | ✓ | ✓ | - | - | - |
| inspection.view_all | ✓ | ✓ | ✓ | ✓ (work center) | ✓ | - |

### F.1.5 Permission Matrix - Training

| Permission | EHS_DIRECTOR | EHS_MANAGER | EHS_SPECIALIST | TRAINER | SUPERVISOR | OPERATOR |
|------------|:------------:|:-----------:|:--------------:|:-------:|:----------:|:--------:|
| training.manage_courses | ✓ | ✓ | - | ✓ | - | - |
| training.assign | ✓ | ✓ | ✓ | ✓ | ✓ | - |
| training.complete (self) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| training.verify_practical | ✓ | ✓ | ✓ | ✓ | ✓ | - |
| training.waive | ✓ | ✓ | - | - | - | - |
| training.view_compliance | ✓ | ✓ | ✓ | ✓ | ✓ | - |
| training.view_all_users | ✓ | ✓ | ✓ | - | - | - |

### F.1.6 Permission Matrix - Policies

| Permission | EHS_DIRECTOR | EHS_MANAGER | EHS_SPECIALIST | BRANCH_MANAGER | OPERATOR |
|------------|:------------:|:-----------:|:--------------:|:--------------:|:--------:|
| policy.create | ✓ | ✓ | ✓ | - | - |
| policy.edit | ✓ | ✓ | ✓ | - | - |
| policy.approve | ✓ | ✓ | - | - | - |
| policy.publish | ✓ | - | - | - | - |
| policy.archive | ✓ | ✓ | - | - | - |
| policy.view | ✓ | ✓ | ✓ | ✓ | ✓ |
| policy.acknowledge | ✓ | ✓ | ✓ | ✓ | ✓ |

### F.1.7 Permission Matrix - Equipment

| Permission | EHS_DIRECTOR | EHS_MANAGER | EHS_SPECIALIST | MAINT_LEAD | SUPERVISOR | OPERATOR |
|------------|:------------:|:-----------:|:--------------:|:----------:|:----------:|:--------:|
| equipment.create | ✓ | ✓ | - | ✓ | - | - |
| equipment.update | ✓ | ✓ | ✓ | ✓ | - | - |
| equipment.out_of_service | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (report) |
| equipment.return_to_service | ✓ | ✓ | - | ✓ | - | - |
| equipment.create_loto_proc | ✓ | ✓ | ✓ | ✓ | - | - |
| equipment.approve_loto_proc | ✓ | ✓ | - | - | - | - |

### F.1.8 Permission Matrix - CAPA

| Permission | EHS_DIRECTOR | EHS_MANAGER | EHS_SPECIALIST | SUPERVISOR | Assignee |
|------------|:------------:|:-----------:|:--------------:|:----------:|:--------:|
| capa.create | ✓ | ✓ | ✓ | ✓ | - |
| capa.assign | ✓ | ✓ | ✓ | ✓ | - |
| capa.update | ✓ | ✓ | ✓ | - | ✓ |
| capa.implement | ✓ | ✓ | ✓ | - | ✓ |
| capa.verify | ✓ | ✓ | ✓ | - | - |
| capa.close | ✓ | ✓ | - | - | - |
| capa.extend_due_date | ✓ | ✓ | - | - | - |

### F.1.9 Permission Matrix - Stop Work

| Permission | Anyone | SUPERVISOR | EHS_SPECIALIST | EHS_MANAGER | EHS_DIRECTOR |
|------------|:------:|:----------:|:--------------:|:-----------:|:------------:|
| stopwork.issue | ✓ | ✓ | ✓ | ✓ | ✓ |
| stopwork.acknowledge | - | ✓ | ✓ | ✓ | ✓ |
| stopwork.mitigate | - | ✓ | ✓ | ✓ | ✓ |
| stopwork.authorize_resume | - | ✓ (non-imminent) | ✓ | ✓ | ✓ |
| stopwork.close | - | - | ✓ | ✓ | ✓ |

## F.2 Data Scope Rules

```typescript
interface SafetyDataScopeRules {
  // Location-based scoping
  locationScoped: {
    EHS_SPECIALIST: 'assigned_locations',
    SUPERVISOR: 'assigned_work_centers',
    OPERATOR: 'assigned_work_centers',
    BRANCH_MANAGER: 'home_location',
    EHS_MANAGER: 'assigned_locations_and_divisions'
  };
  
  // Tenant-wide access
  tenantWide: ['EHS_DIRECTOR', 'SAFETY_AUDITOR'];
  
  // Special rules
  incidentVisibility: {
    // Operators can see incidents they reported or were affected by
    OPERATOR: 'self_reported OR affected_person',
    // Supervisors see their work center incidents
    SUPERVISOR: 'work_center_incidents',
    // EHS sees location or division
    EHS_SPECIALIST: 'location_incidents'
  };
  
  // Contractor restrictions
  contractor: {
    viewPermits: 'own_only',
    viewIncidents: 'own_only',
    viewTraining: 'own_only',
    viewPolicies: 'acknowledged_required_only',
    viewSDS: 'all_active'  // Safety requirement
  };
}
```

## F.3 Approval Authority Limits

| Approval Type | Level 1 | Level 2 | Level 3 |
|---------------|---------|---------|---------|
| Incident Close (First Aid) | Supervisor | - | - |
| Incident Close (Recordable) | EHS Manager | - | - |
| Incident Close (Fatality/Severe) | EHS Director | - | - |
| CAPA Extension | Supervisor | EHS Manager (>7 days) | - |
| CAPA Close | EHS Specialist | EHS Manager (high severity) | - |
| Permit (Standard) | Supervisor | - | - |
| Permit (High Risk) | EHS Specialist | EHS Manager | - |
| Permit (Energized Electrical) | EHS Manager | EHS Director | - |
| Policy Publish | EHS Manager | EHS Director | - |
| Equipment Return to Service | Maintenance Lead | EHS (safety-related) | - |
| Training Waiver | EHS Manager | EHS Director | - |

---

*Continued in Part 3: AI Safety Assistant (G), APIs (H), Eventing + Audit (I)*
