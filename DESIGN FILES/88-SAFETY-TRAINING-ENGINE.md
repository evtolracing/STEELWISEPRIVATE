# 88 - Safety Training Engine

> **Document Version**: 1.0  
> **Date**: February 4, 2026  
> **Author**: Senior Industrial Training Systems Architect  
> **Status**: APPROVED FOR IMPLEMENTATION

---

## Executive Summary

This document defines the **Safety Training Engine**—a competency-driven training management system that enforces workforce qualification at the point of job execution. The engine ensures that no operator can perform work without verified, current competencies for the specific task, asset, and hazard conditions.

**Core Principle**: Training attendance ≠ Competency. Competency must be demonstrated, verified, time-bound, and enforced at every job start. Operators cannot self-certify. Supervisors cannot bypass. The system blocks unsafe work automatically.

---

## A) Training Philosophy & Objectives

### A.1 Training Attendance vs. Competency

```
┌─────────────────────────────────────────────────────────────────────┐
│              TRAINING ATTENDANCE ≠ COMPETENCY                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  TRAINING ATTENDANCE                COMPETENCY                       │
│  ──────────────────────            ─────────────                     │
│  • Sat in a classroom              • Can perform task safely         │
│  • Watched a video                 • Demonstrated proficiency        │
│  • Signed a roster                 • Passed practical assessment     │
│  • Completed online course         • Verified by qualified observer  │
│  • Time-based (1 hour)             • Outcome-based (can do X)        │
│                                                                      │
│  ATTENDANCE PROVES:                COMPETENCY PROVES:                │
│  "I was exposed to content"        "I can do this safely"            │
│                                                                      │
│  ATTENDANCE ALONE:                 COMPETENCY VERIFIED:              │
│  ❌ Not sufficient for work        ✅ Required for work              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**The Danger of Attendance-Only Training**:
- Operators may not retain information
- Understanding ≠ Ability to apply
- No verification of skill transfer
- False sense of compliance
- Audit vulnerability: "They were trained" vs. "They were competent"

**Our Model**: Training is **input**; Competency is **output**. We track and enforce the output.

### A.2 Contextual Competency

Competency is not generic—it must be tied to:

| Context | Why It Matters |
|---------|----------------|
| **Task** | Cutting metal ≠ Cutting plastic ≠ Blade change |
| **Asset** | Saw A ≠ Saw B (different guards, controls) |
| **Hazard** | Low-hazard task ≠ High-hazard task |
| **Environment** | Clean environment ≠ Combustible atmosphere |
| **Material** | Aluminum ≠ Stainless ≠ Titanium (different risks) |

**Example**: An operator competent on `SAW-001` (horizontal bandsaw) is NOT automatically competent on `SAW-002` (vertical cold saw) even though both are "saws."

### A.3 Safety Training Engine Objectives

| Objective | How Achieved |
|-----------|--------------|
| **Reduce Incidents** | Block work when competency gaps exist |
| **Reduce Liability** | Maintain audit-grade competency records |
| **Improve Compliance** | Auto-enforce training expiry and recertification |
| **Enable Growth** | Clear competency paths for operators |
| **Support AI Coaching** | Integrate with Safety AI for personalized training |
| **Streamline Audits** | One-click export of competency evidence |

### A.4 Incident Prevention Chain

```
┌─────────────────────────────────────────────────────────────────────┐
│                    INCIDENT PREVENTION CHAIN                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  COMPETENCY VERIFIED                                                 │
│         │                                                            │
│         ▼                                                            │
│  OPERATOR KNOWS HAZARDS                                              │
│         │                                                            │
│         ▼                                                            │
│  OPERATOR USES CORRECT PPE                                           │
│         │                                                            │
│         ▼                                                            │
│  OPERATOR FOLLOWS PROCEDURE                                          │
│         │                                                            │
│         ▼                                                            │
│  OPERATOR RECOGNIZES UNSAFE CONDITIONS                               │
│         │                                                            │
│         ▼                                                            │
│  INCIDENT PREVENTED ──────────▶ PRODUCTION CONTINUES SAFELY         │
│                                                                      │
│  ═══════════════════════════════════════════════════════════════    │
│                                                                      │
│  IF COMPETENCY NOT VERIFIED:                                         │
│         │                                                            │
│         ▼                                                            │
│  WORK BLOCKED ──────────▶ NO INCIDENT POSSIBLE                       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## B) Training & Competency Model

### B.1 Core Concepts

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TRAINING & COMPETENCY HIERARCHY                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  TRAINING COURSE                                                     │
│  ├── TrainingModule 1                                                │
│  │   ├── Content (video, text, interactive)                         │
│  │   └── Quiz (knowledge check)                                     │
│  ├── TrainingModule 2                                                │
│  │   └── ...                                                        │
│  └── ASSESSMENT                                                      │
│      ├── Written Test                                                │
│      └── Practical Demonstration                                     │
│                                                                      │
│  ══════════════════════════════════════════════════════════════     │
│                                                                      │
│  Upon passing assessment:                                            │
│  COMPETENCY is created → CERTIFICATION is issued                     │
│                                                                      │
│  Certification has:                                                  │
│  • Issue Date                                                        │
│  • Expiry Date                                                       │
│  • Recertification Interval                                          │
│  • Grace Period (if allowed)                                         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### B.2 Entity Definitions

#### TrainingCourse

The top-level container for training content related to a specific competency.

| Field | Description |
|-------|-------------|
| `id` | Unique identifier |
| `code` | Short code (e.g., `FORKLIFT-101`) |
| `name` | Full name (e.g., `Forklift Operation Fundamentals`) |
| `description` | Detailed description |
| `targetCompetency` | Competency this course grants |
| `duration` | Estimated time to complete |
| `format` | `ONLINE`, `CLASSROOM`, `OJT`, `BLENDED` |
| `requiredPriorCourses` | Prerequisites |
| `modules` | List of TrainingModules |
| `assessment` | Associated assessment |
| `recertInterval` | Months until recertification required |
| `gracePeriodDays` | Days after expiry before hard block |
| `status` | `DRAFT`, `ACTIVE`, `RETIRED` |

#### TrainingModule

A unit of instruction within a course.

| Field | Description |
|-------|-------------|
| `id` | Unique identifier |
| `courseId` | Parent course |
| `sequence` | Order within course |
| `name` | Module name |
| `type` | `VIDEO`, `TEXT`, `INTERACTIVE`, `QUIZ` |
| `contentUrl` | Link to content |
| `duration` | Estimated time |
| `passingScore` | Minimum quiz score (if quiz) |
| `required` | Must complete to progress |

#### Assessment

Verification that knowledge/skill has been acquired.

| Field | Description |
|-------|-------------|
| `id` | Unique identifier |
| `courseId` | Associated course |
| `type` | `WRITTEN`, `PRACTICAL`, `BOTH` |
| `passingScore` | Minimum score (%) |
| `maxAttempts` | Allowed attempts |
| `timeLimit` | Minutes allowed |
| `questions` | For written: question bank |
| `practicalChecklist` | For practical: skill checklist |
| `evaluatorRoleRequired` | Role that can evaluate practical |

#### Competency

The capability to perform a specific task safely.

| Field | Description |
|-------|-------------|
| `id` | Unique identifier |
| `code` | Short code (e.g., `COMP-FORKLIFT-OP`) |
| `name` | Full name |
| `description` | What this competency enables |
| `category` | `EQUIPMENT`, `PROCESS`, `SAFETY`, `HAZARD` |
| `hazardLevel` | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `requiredFor` | Work centers, tasks, assets |
| `trainingCourseId` | Course that grants this |
| `recertInterval` | Months (inherited from course or override) |

#### Certification

Time-bound proof of competency.

| Field | Description |
|-------|-------------|
| `id` | Unique identifier |
| `userId` | Operator ID |
| `competencyId` | Competency certified |
| `courseCompletionId` | Associated training completion |
| `assessmentResultId` | Assessment that verified competency |
| `level` | `AWARE`, `AUTHORIZED`, `QUALIFIED`, `TRAINER` |
| `issuedAt` | Date issued |
| `expiresAt` | Date expires |
| `issuedBy` | Evaluator who verified |
| `status` | `ACTIVE`, `EXPIRING_SOON`, `EXPIRED`, `SUSPENDED`, `REVOKED` |

### B.3 Competency Levels

```
┌─────────────────────────────────────────────────────────────────────┐
│                    COMPETENCY LEVELS                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  LEVEL 0: NONE                                                       │
│  ─────────────────                                                   │
│  No training or competency                                           │
│  → Cannot enter area or perform any related work                     │
│                                                                      │
│  LEVEL 1: AWARE                                                      │
│  ─────────────────                                                   │
│  Completed awareness training                                        │
│  → Knows hazards exist                                               │
│  → Can work in area with supervision                                 │
│  → Cannot operate equipment                                          │
│  Example: LOTO Awareness, Forklift Pedestrian Safety                 │
│                                                                      │
│  LEVEL 2: AUTHORIZED                                                 │
│  ─────────────────────                                               │
│  Completed full training + passed assessment                         │
│  → Can perform task under direct supervision                         │
│  → Must have qualified operator present                              │
│  Example: New operator in training period                            │
│                                                                      │
│  LEVEL 3: QUALIFIED                                                  │
│  ─────────────────────                                               │
│  Demonstrated proficiency independently                              │
│  → Can perform task without supervision                              │
│  → Full authorization for work                                       │
│  Example: Certified forklift operator, Certified saw operator        │
│                                                                      │
│  LEVEL 4: TRAINER                                                    │
│  ───────────────────                                                 │
│  Qualified + train-the-trainer certification                         │
│  → Can train and evaluate others                                     │
│  → Can sign off on practical assessments                             │
│  Example: OJT trainer, Designated evaluator                          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### B.4 Recertification & Expiry

| Competency Type | Recertification Interval | Grace Period | Hard Block |
|-----------------|--------------------------|--------------|------------|
| Forklift Operation | 36 months | 14 days | After grace |
| Crane Operation | 12 months | 7 days | After grace |
| LOTO (Authorized) | 12 months | 7 days | After grace |
| Hot Work | 12 months | 0 days | Immediate |
| First Aid / CPR | 24 months | 30 days | After grace |
| Electrical Safety (Qualified) | 12 months | 0 days | Immediate |
| Machine-Specific | 24 months | 14 days | After grace |
| General Safety Orientation | 12 months | 7 days | After grace |

**Grace Period Rules**:
- During grace period: Warning shown, work allowed, supervisor notified
- After grace period: Work blocked, training required
- Some high-risk competencies have **zero grace period**

---

## C) Competency Mapping (Role → Work Center → Task)

### C.1 Mapping Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    COMPETENCY REQUIREMENT MAPPING                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                    ┌───────────────────┐                             │
│                    │       ROLE        │                             │
│                    │ (Operator, Maint) │                             │
│                    └─────────┬─────────┘                             │
│                              │                                       │
│           ┌──────────────────┼──────────────────┐                    │
│           │                  │                  │                    │
│           ▼                  ▼                  ▼                    │
│   ┌───────────────┐  ┌───────────────┐  ┌───────────────┐           │
│   │  WORK CENTER  │  │  WORK CENTER  │  │  WORK CENTER  │           │
│   │    (Saw)      │  │  (Forklift)   │  │   (Crane)     │           │
│   └───────┬───────┘  └───────┬───────┘  └───────┬───────┘           │
│           │                  │                  │                    │
│     ┌─────┴─────┐      ┌─────┴─────┐      ┌─────┴─────┐              │
│     │           │      │           │      │           │              │
│     ▼           ▼      ▼           ▼      ▼           ▼              │
│  ┌──────┐   ┌──────┐                                                 │
│  │ TASK │   │ TASK │   ... (each task has competency requirements)  │
│  │ Cut  │   │Blade │                                                 │
│  │      │   │Change│                                                 │
│  └──┬───┘   └──┬───┘                                                 │
│     │          │                                                     │
│     ▼          ▼                                                     │
│  Required   Required                                                 │
│ Competencies Competencies                                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### C.2 Role-Based Competency Requirements

#### OPERATOR Role

| Work Center | Base Competencies Required |
|-------------|---------------------------|
| All | General Safety Orientation, PPE Usage |
| Saw | Saw Operation, Machine Guarding Awareness, Hearing Protection |
| Router | Router Operation, Machine Guarding, Dust Hazards |
| Shear | Shear Operation, Pinch Point Hazards, Two-Hand Control |
| Forklift | Forklift Operation, Pedestrian Safety, Load Stability |
| Crane | Crane Operation, Rigging Basics, Hand Signals |
| Packaging | Manual Handling, Strapping Equipment, Banding Safety |

#### MAINTENANCE Role

| Work Center | Base Competencies Required |
|-------------|---------------------------|
| All | General Safety, LOTO Authorized, Machine Guarding, Electrical Awareness |
| Electrical | Electrical Safety Qualified, Arc Flash, NFPA 70E |
| Mechanical | Mechanical Safeguarding, Hydraulics, Pneumatics |
| Hot Work | Hot Work Permit, Fire Watch, Fire Extinguisher |

#### SUPERVISOR Role

| Competencies Required |
|----------------------|
| All operator competencies for supervised area |
| Hazard Recognition |
| Incident Investigation |
| Training Records Management |
| LOTO Authorized |
| First Aid / CPR |

### C.3 Task-Specific Competency Matrix

#### Saw Work Center

| Task | Required Competencies | Level |
|------|----------------------|-------|
| Cut Material (normal) | Saw Operation | QUALIFIED |
| | PPE - Hearing | QUALIFIED |
| | PPE - Eye | QUALIFIED |
| Cut Material (titanium) | Saw Operation | QUALIFIED |
| | Titanium Fire Hazards | QUALIFIED |
| | Fire Extinguisher | AWARE |
| Blade Change | Saw Operation | QUALIFIED |
| | LOTO Awareness | AWARE |
| | Blade Handling | QUALIFIED |
| Machine Cleaning | Saw Operation | AUTHORIZED+ |
| | Chip Handling | AWARE |
| Saw Maintenance | LOTO Authorized | QUALIFIED |
| | Mechanical Safety | QUALIFIED |
| | Saw-Specific Maintenance | QUALIFIED |

#### Forklift Work Center

| Task | Required Competencies | Level |
|------|----------------------|-------|
| Transport Load (standard) | Forklift Operation | QUALIFIED |
| | Pedestrian Safety | QUALIFIED |
| Stack High (>10ft) | Forklift Operation | QUALIFIED |
| | High Stacking | QUALIFIED |
| Load Truck | Forklift Operation | QUALIFIED |
| | Truck Loading Safety | QUALIFIED |
| Forklift Pre-Inspection | Forklift Operation | AUTHORIZED+ |
| | Pre-Trip Inspection | AWARE |
| LPG Tank Change | Forklift Operation | QUALIFIED |
| | LPG Safety | QUALIFIED |

#### Crane Work Center

| Task | Required Competencies | Level |
|------|----------------------|-------|
| Operate Overhead Crane | Crane Operation | QUALIFIED |
| | Rigging Basics | AWARE |
| | Load Calculation | QUALIFIED |
| Rig Load | Rigging | QUALIFIED |
| | Sling Inspection | QUALIFIED |
| Critical Lift (>75% capacity) | Crane Operation | QUALIFIED |
| | Critical Lift Planning | QUALIFIED |
| | Signal Person | QUALIFIED |
| Crane Inspection | Crane Operation | QUALIFIED |
| | Crane Inspection | QUALIFIED |

### C.4 Hazard-Level Requirements

| Hazard Level | Additional Requirements |
|--------------|------------------------|
| **LOW** | Base competencies only |
| **MEDIUM** | Base + Hazard-specific awareness |
| **HIGH** | Base + Hazard-specific qualified + Supervisor notification |
| **CRITICAL** | Base + Hazard-specific qualified + Permit + EHS approval |

### C.5 Asset-Specific Requirements

Some assets require additional competencies beyond work center:

| Asset ID | Asset Name | Additional Competencies |
|----------|------------|------------------------|
| SAW-003 | DoAll Vertical Bandsaw | Vertical Saw Operation (different controls) |
| CRANE-002 | 20-Ton Bridge Crane | Heavy Lift Certification |
| FORK-007 | Reach Truck | Reach Truck Operation (separate from sit-down) |
| SHEAR-001 | 1/4" Plate Shear | Heavy Gauge Shear (hydraulic vs mechanical) |

---

## D) Training Lifecycle (State Machines)

### D.1 Training Assignment State Machine

```
┌─────────────────────────────────────────────────────────────────────┐
│              TRAINING ASSIGNMENT STATE MACHINE                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────┐                                                      │
│  │  ASSIGNED  │◄─── Supervisor or system assigns training            │
│  └─────┬──────┘                                                      │
│        │                                                             │
│        │ Operator starts course                                      │
│        ▼                                                             │
│  ┌─────────────┐                                                     │
│  │ IN_PROGRESS │◄─── Operator working through modules                │
│  └──────┬──────┘                                                     │
│         │                                                            │
│         ├──── Modules complete ────▶ ┌─────────────────┐            │
│         │                            │ PENDING_ASSESS  │            │
│         │                            └────────┬────────┘            │
│         │                                     │                      │
│         │                        Assessment submitted                │
│         │                                     │                      │
│         │                            ┌────────┴────────┐             │
│         │                            │                 │             │
│         │                         Pass              Fail             │
│         │                            │                 │             │
│         │                            ▼                 ▼             │
│         │                     ┌───────────┐    ┌───────────┐        │
│         │                     │ COMPLETED │    │  FAILED   │        │
│         │                     └─────┬─────┘    └─────┬─────┘        │
│         │                           │                │               │
│         │               Evaluator verifies      Retry?               │
│         │                           │                │               │
│         │                           ▼                │               │
│         │                     ┌──────────┐           │               │
│         │                     │ VERIFIED │           │               │
│         │                     └────┬─────┘           │               │
│         │                          │                 │               │
│         │              Certification issued          │               │
│         │                          │                 │               │
│         │                          ▼                 │               │
│         │                     ┌────────┐             │               │
│         │                     │ ACTIVE │             │               │
│         │                     └───┬────┘             │               │
│         │                         │                  │               │
│         │              Time passes (expires)         │               │
│         │                         │                  │               │
│         │                         ▼                  │               │
│         │                    ┌─────────┐             │               │
│         └────────────────────│ EXPIRED │◄────────────┘               │
│                              └─────────┘                             │
│                                                                      │
│  ─────────────────────────────────────────────────                   │
│  ABANDONED: If training not completed within deadline                │
│  ─────────────────────────────────────────────────                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### D.2 Competency Status State Machine

```
┌─────────────────────────────────────────────────────────────────────┐
│                 COMPETENCY STATUS STATE MACHINE                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────┐                                                         │
│  │ PENDING │◄─── Training assigned, not yet started                  │
│  └────┬────┘                                                         │
│       │                                                              │
│       │ Training completed + assessment passed                       │
│       │ (Practical in progress or not required)                      │
│       ▼                                                              │
│  ┌────────────┐                                                      │
│  │ AUTHORIZED │◄─── Can work WITH supervision                        │
│  └─────┬──────┘                                                      │
│        │                                                             │
│        │ Practical verified by evaluator                             │
│        │ OR supervision period complete                              │
│        ▼                                                             │
│  ┌───────────┐                                                       │
│  │ QUALIFIED │◄─── Can work INDEPENDENTLY                            │
│  └─────┬─────┘                                                       │
│        │                                                             │
│        ├──── 30 days before expiry ────▶ ┌───────────────┐          │
│        │                                 │ EXPIRING_SOON │          │
│        │                                 └───────┬───────┘          │
│        │                                         │                   │
│        │                            ┌────────────┴────────────┐      │
│        │                            │                         │      │
│        │                      Recertified                 Expires    │
│        │                            │                         │      │
│        │                            ▼                         ▼      │
│        │◀───────────────────── QUALIFIED              ┌─────────┐   │
│        │                                              │ EXPIRED │   │
│        │                                              └────┬────┘   │
│        │                                                   │        │
│        │                              ┌────────────────────┘        │
│        │                              │                              │
│        │                   ┌──────────┴──────────┐                   │
│        │                   │                     │                   │
│        │            In Grace Period        Past Grace                │
│        │                   │                     │                   │
│        │                   ▼                     ▼                   │
│        │           ┌────────────┐         ┌───────────┐             │
│        │           │ GRACE_WARN │         │  BLOCKED  │             │
│        │           └─────┬──────┘         └───────────┘             │
│        │                 │                                          │
│        │           Recertified                                       │
│        │                 │                                          │
│        │                 ▼                                          │
│        │◀─────────── QUALIFIED                                       │
│        │                                                             │
│        │                                                             │
│        └──── Violation / Incident ────▶ ┌───────────┐               │
│                                         │ SUSPENDED │               │
│                                         └─────┬─────┘               │
│                                               │                      │
│                                     Retraining + Approval            │
│                                               │                      │
│                                               ▼                      │
│                                         ┌───────────┐                │
│                                         │ QUALIFIED │                │
│                                         └───────────┘                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### D.3 State Transition Rules

| From State | To State | Trigger | Actor |
|------------|----------|---------|-------|
| PENDING | AUTHORIZED | Training + Assessment complete | System |
| AUTHORIZED | QUALIFIED | Practical verified | Evaluator (TRAINER level) |
| QUALIFIED | EXPIRING_SOON | 30 days before expiresAt | System (scheduled) |
| EXPIRING_SOON | QUALIFIED | Recertification complete | System |
| EXPIRING_SOON | EXPIRED | expiresAt reached | System (scheduled) |
| QUALIFIED | EXPIRED | expiresAt reached (no warning period) | System |
| EXPIRED | GRACE_WARN | Within grace period | System |
| EXPIRED | BLOCKED | Past grace period | System |
| GRACE_WARN | QUALIFIED | Recertification complete | System |
| GRACE_WARN | BLOCKED | Grace period ends | System (scheduled) |
| BLOCKED | PENDING | Training re-assigned | Supervisor |
| ANY | SUSPENDED | Safety violation / incident | EHS Manager |
| SUSPENDED | PENDING | Remediation plan assigned | EHS Manager |

### D.4 Automatic State Transitions

A scheduled job runs daily to process expirations:

```javascript
async function processCompetencyExpirations() {
  const today = new Date();
  
  // 1. Find certifications expiring in 30 days
  const expiringIn30 = await Certification.findAll({
    where: {
      expiresAt: { between: [today, addDays(today, 30)] },
      status: 'QUALIFIED'
    }
  });
  
  for (const cert of expiringIn30) {
    await cert.update({ status: 'EXPIRING_SOON' });
    await notifyOperator(cert.userId, 'COMPETENCY_EXPIRING', cert);
    await notifySupervisor(cert.userId, 'TEAM_COMPETENCY_EXPIRING', cert);
  }
  
  // 2. Find certifications that expired today
  const expiredToday = await Certification.findAll({
    where: {
      expiresAt: { lt: today },
      status: { in: ['QUALIFIED', 'EXPIRING_SOON'] }
    }
  });
  
  for (const cert of expiredToday) {
    const competency = await Competency.findById(cert.competencyId);
    const graceDays = competency.gracePeriodDays || 0;
    
    if (graceDays > 0) {
      await cert.update({ 
        status: 'GRACE_WARN',
        graceEndsAt: addDays(cert.expiresAt, graceDays)
      });
    } else {
      await cert.update({ status: 'BLOCKED' });
    }
    
    await notifyOperator(cert.userId, 'COMPETENCY_EXPIRED', cert);
    await notifySupervisor(cert.userId, 'TEAM_COMPETENCY_EXPIRED', cert);
  }
  
  // 3. Find certifications past grace period
  const pastGrace = await Certification.findAll({
    where: {
      status: 'GRACE_WARN',
      graceEndsAt: { lt: today }
    }
  });
  
  for (const cert of pastGrace) {
    await cert.update({ status: 'BLOCKED' });
    await notifyOperator(cert.userId, 'COMPETENCY_BLOCKED', cert);
    await notifySupervisor(cert.userId, 'TEAM_COMPETENCY_BLOCKED', cert);
  }
}
```

---

## E) Job Start Enforcement Rules

### E.1 Enforcement Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    JOB START ENFORCEMENT FLOW                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  OPERATOR SCANS JOB                                                  │
│         │                                                            │
│         ▼                                                            │
│  ┌─────────────────────────────────────┐                            │
│  │     COMPETENCY VALIDATION ENGINE    │                            │
│  ├─────────────────────────────────────┤                            │
│  │                                     │                            │
│  │  1. Get Job Details                 │                            │
│  │     • Work Center                   │                            │
│  │     • Operation Type                │                            │
│  │     • Asset(s)                      │                            │
│  │     • Material                      │                            │
│  │     • Hazard Level                  │                            │
│  │                                     │                            │
│  │  2. Build Required Competency List  │                            │
│  │     • Role-based requirements       │                            │
│  │     • Work center requirements      │                            │
│  │     • Task requirements             │                            │
│  │     • Asset-specific requirements   │                            │
│  │     • Hazard-level requirements     │                            │
│  │     • Permit requirements           │                            │
│  │                                     │                            │
│  │  3. Validate Each Competency        │                            │
│  │     • Has certification? Yes/No     │                            │
│  │     • Status = QUALIFIED?           │                            │
│  │     • Not expired?                  │                            │
│  │     • Not suspended?                │                            │
│  │     • Level sufficient?             │                            │
│  │                                     │                            │
│  │  4. Check Active Permits            │                            │
│  │     • Required permits exist?       │                            │
│  │     • Permits valid/not expired?    │                            │
│  │                                     │                            │
│  └───────────────┬─────────────────────┘                            │
│                  │                                                   │
│        ┌─────────┴─────────┐                                         │
│        │                   │                                         │
│   ALL PASS           ANY FAIL                                        │
│        │                   │                                         │
│        ▼                   ▼                                         │
│  ┌───────────┐      ┌───────────────┐                               │
│  │ ALLOW JOB │      │  BLOCK START  │                               │
│  │   START   │      │               │                               │
│  └───────────┘      │ • Show reason │                               │
│                     │ • List gaps   │                               │
│                     │ • Suggest fix │                               │
│                     │ • Notify supv │                               │
│                     └───────────────┘                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### E.2 Enforcement Algorithm

```javascript
async function validateOperatorForOperation(operatorId, operationId) {
  const result = {
    allowed: true,
    blocks: [],
    warnings: [],
    requiredCompetencies: [],
    operatorCompetencies: []
  };
  
  // 1. Load operation details
  const operation = await Operation.findById(operationId, {
    include: [Job, WorkCenter, Asset]
  });
  
  // 2. Build required competency list
  const requirements = await buildRequirementsList(
    operation.workCenterId,
    operation.taskType,
    operation.asset?.id,
    operation.hazardLevel,
    operation.job.materialType
  );
  
  result.requiredCompetencies = requirements;
  
  // 3. Load operator certifications
  const operator = await User.findById(operatorId, {
    include: [{ model: Certification, where: { status: { not: 'REVOKED' } } }]
  });
  
  result.operatorCompetencies = operator.certifications;
  
  // 4. Validate each requirement
  for (const req of requirements) {
    const cert = operator.certifications.find(
      c => c.competencyId === req.competencyId
    );
    
    if (!cert) {
      // No certification at all
      result.allowed = false;
      result.blocks.push({
        type: 'MISSING_COMPETENCY',
        competencyId: req.competencyId,
        competencyName: req.competencyName,
        requiredLevel: req.level,
        message: `Missing required competency: ${req.competencyName}`,
        trainingCourseId: req.trainingCourseId,
        trainingCourseName: req.trainingCourseName
      });
      continue;
    }
    
    // Check status
    if (cert.status === 'BLOCKED' || cert.status === 'SUSPENDED') {
      result.allowed = false;
      result.blocks.push({
        type: 'COMPETENCY_BLOCKED',
        competencyId: req.competencyId,
        competencyName: req.competencyName,
        certificationStatus: cert.status,
        message: `Competency ${cert.status}: ${req.competencyName}`,
        action: cert.status === 'SUSPENDED' ? 
          'Contact EHS for remediation' : 'Complete recertification training'
      });
      continue;
    }
    
    if (cert.status === 'EXPIRED' || cert.status === 'GRACE_WARN') {
      // Check if hard block or warning
      const competency = await Competency.findById(req.competencyId);
      if (competency.gracePeriodDays === 0 || cert.status === 'EXPIRED') {
        result.allowed = false;
        result.blocks.push({
          type: 'COMPETENCY_EXPIRED',
          competencyId: req.competencyId,
          competencyName: req.competencyName,
          expiredAt: cert.expiresAt,
          message: `Competency expired: ${req.competencyName}`,
          action: 'Complete recertification training'
        });
      } else {
        // Grace period warning
        result.warnings.push({
          type: 'COMPETENCY_GRACE_PERIOD',
          competencyId: req.competencyId,
          competencyName: req.competencyName,
          graceEndsAt: cert.graceEndsAt,
          message: `Competency in grace period: ${req.competencyName} - Recertify by ${cert.graceEndsAt}`
        });
      }
      continue;
    }
    
    // Check level
    const levelHierarchy = ['AWARE', 'AUTHORIZED', 'QUALIFIED', 'TRAINER'];
    const requiredLevelIndex = levelHierarchy.indexOf(req.level);
    const certLevelIndex = levelHierarchy.indexOf(cert.level);
    
    if (certLevelIndex < requiredLevelIndex) {
      result.allowed = false;
      result.blocks.push({
        type: 'INSUFFICIENT_LEVEL',
        competencyId: req.competencyId,
        competencyName: req.competencyName,
        requiredLevel: req.level,
        actualLevel: cert.level,
        message: `Insufficient competency level: ${req.competencyName} requires ${req.level}, you have ${cert.level}`,
        action: req.level === 'QUALIFIED' ? 
          'Complete practical evaluation to upgrade' : 'Contact supervisor'
      });
      continue;
    }
    
    // Check supervision requirement for AUTHORIZED level
    if (cert.level === 'AUTHORIZED' && req.level === 'QUALIFIED') {
      result.warnings.push({
        type: 'SUPERVISION_REQUIRED',
        competencyId: req.competencyId,
        competencyName: req.competencyName,
        message: `Supervision required for: ${req.competencyName}`
      });
    }
  }
  
  // 5. Check permit requirements
  const permitRequirements = await getPermitRequirements(operation);
  for (const permitReq of permitRequirements) {
    const activePermit = await getActivePermit(operatorId, permitReq.type, operation.workCenterId);
    if (!activePermit) {
      result.allowed = false;
      result.blocks.push({
        type: 'PERMIT_REQUIRED',
        permitType: permitReq.type,
        message: `Active ${permitReq.type} permit required for this operation`,
        action: 'Obtain permit before starting work'
      });
    } else if (isExpired(activePermit)) {
      result.allowed = false;
      result.blocks.push({
        type: 'PERMIT_EXPIRED',
        permitType: permitReq.type,
        permitId: activePermit.id,
        expiredAt: activePermit.expiresAt,
        message: `${permitReq.type} permit expired`,
        action: 'Renew permit before starting work'
      });
    }
  }
  
  // 6. Log validation result
  await createAuditLog({
    type: 'COMPETENCY_VALIDATION',
    operatorId,
    operationId,
    result: result.allowed ? 'PASSED' : 'BLOCKED',
    blocks: result.blocks,
    warnings: result.warnings
  });
  
  // 7. Notify supervisor if blocked
  if (!result.allowed) {
    await notifySupervisor(operatorId, 'JOB_BLOCKED_COMPETENCY', {
      operatorId,
      operationId,
      blocks: result.blocks
    });
  }
  
  return result;
}
```

### E.3 Block Response UI

When a job is blocked, the operator sees:

```
┌─────────────────────────────────────────────────────────────────────┐
│  ⛔ CANNOT START OPERATION                                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Job: JOB-2026-4521 - Cut Aluminum Plate                            │
│  Work Center: SAW-002 - Kasto Vertical Bandsaw                      │
│                                                                      │
│  ══════════════════════════════════════════════════════════════     │
│  MISSING OR EXPIRED COMPETENCIES:                                    │
│  ══════════════════════════════════════════════════════════════     │
│                                                                      │
│  ❌ Vertical Bandsaw Operation                                       │
│     Status: MISSING                                                  │
│     Required Level: QUALIFIED                                        │
│     Training Required: SAW-201 Vertical Bandsaw Operation           │
│     [Enroll in Training]                                            │
│                                                                      │
│  ❌ Aluminum Cutting Hazards                                         │
│     Status: EXPIRED (Expired Jan 15, 2026)                          │
│     Required Level: AWARE                                            │
│     Training Required: MTL-101 Aluminum Safety                      │
│     [Enroll in Training]                                            │
│                                                                      │
│  ══════════════════════════════════════════════════════════════     │
│  YOUR SUPERVISOR HAS BEEN NOTIFIED                                   │
│  ══════════════════════════════════════════════════════════════     │
│                                                                      │
│  [Ask AI Assistant]  [Contact Supervisor]  [Return to Queue]        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### E.4 Stop-Work Authority Integration

If an operator is found working without valid competencies:

```javascript
async function handleCompetencyViolation(operatorId, operationId, violations) {
  // 1. Auto-trigger Stop-Work Authority
  const swa = await createStopWorkEvent({
    initiatedBy: 'SYSTEM',
    reason: 'COMPETENCY_VIOLATION',
    scope: 'OPERATOR',
    scopeId: operatorId,
    affectedOperations: [operationId],
    description: `Operator working without required competencies: ${violations.map(v => v.competencyName).join(', ')}`,
    severity: 'HIGH'
  });
  
  // 2. Immediately block operator from all work
  await suspendAllCertifications(operatorId, swa.id);
  
  // 3. Notify chain
  await notifyOperator(operatorId, 'SWA_TRIGGERED', swa);
  await notifySupervisor(operatorId, 'SWA_TEAM_MEMBER', swa);
  await notifyEHS('SWA_COMPETENCY', swa);
  
  // 4. Create remediation plan
  await createRemediationPlan(operatorId, violations);
  
  return swa;
}
```

### E.5 Supervisor Override Policy

**Supervisors CANNOT bypass competency requirements.**

```javascript
function attemptSupervisorOverride(supervisorId, operatorId, operationId) {
  // Log the attempt
  createAuditLog({
    type: 'OVERRIDE_ATTEMPT',
    actorId: supervisorId,
    targetId: operatorId,
    operationId: operationId,
    result: 'DENIED',
    reason: 'SUPERVISOR_OVERRIDE_NOT_PERMITTED_FOR_COMPETENCY'
  });
  
  // Notify EHS of override attempt
  notifyEHS('OVERRIDE_ATTEMPT', {
    supervisor: supervisorId,
    operator: operatorId,
    operation: operationId
  });
  
  // Return denial
  return {
    allowed: false,
    message: 'Competency requirements cannot be overridden. Operator must complete required training.'
  };
}
```

**Only EHS Manager can temporarily authorize work** in emergency situations, with full audit trail and follow-up training requirement.

---

## F) AI-Assisted Training & Coaching

### F.1 AI Capabilities

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AI TRAINING ASSISTANT CAPABILITIES                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  TRAINING RECOMMENDATIONS                                            │
│  ────────────────────────────                                        │
│  • Suggests training based on role changes                           │
│  • Identifies gaps based on assigned work centers                    │
│  • Recommends refresher training proactively                         │
│  • Prioritizes training by expiry urgency                            │
│                                                                      │
│  REQUIREMENT EXPLANATION                                             │
│  ────────────────────────                                            │
│  • Explains why specific training is required                        │
│  • Answers "Why can't I start this job?"                             │
│  • Links competencies to specific hazards                            │
│  • Clarifies difference between levels (AWARE vs QUALIFIED)          │
│                                                                      │
│  MICRO-LEARNING GENERATION                                           │
│  ────────────────────────────                                        │
│  • Generates quick refresher content                                 │
│  • Creates just-in-time learning snippets                            │
│  • Summarizes key safety points before job start                     │
│  • Provides asset-specific tips                                      │
│                                                                      │
│  COACHING SUPPORT                                                    │
│  ────────────────                                                    │
│  • Assists supervisors with training plans                           │
│  • Identifies team-wide skill gaps                                   │
│  • Suggests mentorship pairings                                      │
│  • Tracks coaching effectiveness                                     │
│                                                                      │
│  PATTERN ANALYSIS                                                    │
│  ────────────────                                                    │
│  • Flags recurring competency failures                               │
│  • Identifies high-risk operators                                    │
│  • Correlates training gaps with incidents                           │
│  • Recommends curriculum improvements                                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### F.2 AI Interaction Examples

#### "Why can't I start this job?"

```
┌─────────────────────────────────────────────────────────────────────┐
│  OPERATOR: Why can't I start this job?                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  🤖 SAFETY AI ASSISTANT                                              │
│                                                                      │
│  I can explain the competency requirements for Job JOB-2026-4521.   │
│                                                                      │
│  This job involves operating the Kasto Vertical Bandsaw (SAW-002)   │
│  to cut aluminum plate. Here's what's required and why:              │
│                                                                      │
│  ❌ VERTICAL BANDSAW OPERATION (Missing)                             │
│  This competency is required because vertical bandsaws have          │
│  different blade tension systems, feed controls, and guarding        │
│  than horizontal bandsaws. Even experienced horizontal saw           │
│  operators need specific training on vertical operation.             │
│                                                                      │
│  ❌ ALUMINUM CUTTING HAZARDS (Expired Jan 15)                        │
│  Aluminum presents unique hazards including:                         │
│  • Combustible metal chips (fire risk)                               │
│  • Specific coolant requirements                                     │
│  • Chip handling procedures                                          │
│  Annual refresher ensures awareness of these hazards.                │
│                                                                      │
│  ─────────────────────────────────────────                           │
│  TO RESOLVE:                                                         │
│  1. Enroll in SAW-201 Vertical Bandsaw Operation (2 hours)          │
│  2. Complete MTL-101 Aluminum Safety refresher (30 min)              │
│                                                                      │
│  Would you like me to enroll you in these courses?                   │
│  [Yes, Enroll Me]  [Talk to Supervisor First]                       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

#### Supervisor Coaching Plan

```
┌─────────────────────────────────────────────────────────────────────┐
│  SUPERVISOR: Create a training plan for my team                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  🤖 SAFETY AI ASSISTANT                                              │
│                                                                      │
│  I've analyzed your team's competency status and upcoming work.     │
│  Here's a prioritized training plan:                                 │
│                                                                      │
│  🔴 URGENT (This Week)                                               │
│  ─────────────────────                                               │
│  • Mike Johnson: LOTO Authorized expires Feb 10                      │
│    → Enroll in SAF-202 LOTO Recertification                         │
│    → 2-hour course + practical evaluation                           │
│                                                                      │
│  🟡 HIGH PRIORITY (This Month)                                       │
│  ──────────────────────────────                                      │
│  • Sarah Williams: Missing Reach Truck certification                 │
│    → You assigned her to warehouse work centers                      │
│    → Enroll in FRK-201 Reach Truck Operation                        │
│                                                                      │
│  • Tom Chen: Crane operation expires Feb 28                          │
│    → Enroll in CRN-101 Recertification                              │
│                                                                      │
│  🟢 RECOMMENDED (This Quarter)                                       │
│  ─────────────────────────────                                       │
│  • Cross-train 2 operators on vertical saw                          │
│    → Currently only 1 qualified operator (coverage risk)             │
│    → Candidates: Jake Miller, Ana Rodriguez (both interested)       │
│                                                                      │
│  [Generate Full Report]  [Assign All Training]  [Export Calendar]   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### F.3 AI Guardrails

| Rule | Enforcement |
|------|-------------|
| **AI cannot certify competency** | No API access to certification write endpoints |
| **AI cannot waive requirements** | Cannot modify competency requirement mappings |
| **AI cannot approve training completion** | Can only recommend, not approve |
| **AI cannot issue permits** | Read-only access to permit system |
| **AI defers to policy** | All responses cite policy sources |
| **AI logs all interactions** | Full audit trail of AI recommendations |

```javascript
// AI response guardrails
const AI_GUARDRAILS = {
  cannotDo: [
    'issue_certification',
    'waive_training_requirement',
    'approve_competency',
    'bypass_job_block',
    'delete_training_record',
    'modify_expiry_date',
    'override_safety_control'
  ],
  mustDo: [
    'cite_policy_source',
    'defer_to_supervisor_approval',
    'recommend_official_training',
    'log_all_interactions',
    'maintain_audit_trail'
  ],
  responses: {
    waiveRequest: "I'm not able to waive training requirements. Safety competencies must be earned through official training and assessment. Would you like me to help you enroll in the required training?",
    certifyRequest: "I'm not authorized to certify competencies. Only designated evaluators with TRAINER level certification can verify practical competency. I can help you find an available evaluator.",
    overrideRequest: "Competency requirements cannot be overridden. These requirements exist to protect you and others. Let me explain why this specific training is important."
  }
};
```

### F.4 AI-Generated Micro-Learning

Before a job starts (if operator is qualified), AI can provide refresher:

```
┌─────────────────────────────────────────────────────────────────────┐
│  📚 QUICK REFRESHER: Vertical Bandsaw - Aluminum                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  You last operated SAW-002 45 days ago. Here's a quick refresher:   │
│                                                                      │
│  ⚠️ ALUMINUM-SPECIFIC REMINDERS:                                    │
│  • Use flood coolant - aluminum chips are combustible when dry      │
│  • Keep fire extinguisher (Class D) within reach                    │
│  • Collect chips in designated container (separate from steel)      │
│                                                                      │
│  ⚙️ SAW-002 SPECIFICS:                                              │
│  • Blade type: Bi-metal 10/14 TPI (verify before starting)         │
│  • Feed rate: 2-3 inch/min for 2" plate                            │
│  • This saw has AUTO-STOP guard sensor - don't bypass              │
│                                                                      │
│  🛡️ PPE CHECK:                                                      │
│  ☑ Safety glasses                                                    │
│  ☑ Hearing protection                                                │
│  ☑ Cut-resistant gloves (for handling material)                     │
│                                                                      │
│  [I've Reviewed This]  [Show Full Procedure]  [Report Issue]        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## G) UI / UX Design (Material UI)

### G.1 Component Architecture

```
TRAINING & COMPETENCY UI
├── Operator Views
│   ├── MyTrainingDashboard.jsx
│   ├── MyCompetencies.jsx
│   ├── TrainingCourse.jsx (in-progress course)
│   ├── AssessmentView.jsx
│   └── BlockedJobExplanation.jsx
│
├── Supervisor Views
│   ├── TeamTrainingStatus.jsx
│   ├── CompetencyGapAnalysis.jsx
│   ├── TrainingAssignment.jsx
│   ├── PracticalEvaluation.jsx
│   └── CoachingDashboard.jsx
│
├── EHS Views
│   ├── TrainingCoverage.jsx
│   ├── CriticalGaps.jsx
│   ├── ExpiryTrends.jsx
│   ├── ComplianceReport.jsx
│   └── AuditExport.jsx
│
├── Admin Views
│   ├── CourseManagement.jsx
│   ├── CompetencyMapping.jsx
│   ├── AssessmentBuilder.jsx
│   └── RequirementRules.jsx
│
└── Shared Components
    ├── CompetencyCard.jsx
    ├── TrainingProgress.jsx
    ├── ExpiryBadge.jsx
    └── CompetencyMatrix.jsx
```

### G.2 Operator Dashboard

```jsx
<Box sx={{ p: 3 }}>
  <Typography variant="h4" gutterBottom>
    My Training & Competencies
  </Typography>
  
  {/* Alerts Section */}
  {expiringCertifications.length > 0 && (
    <Alert severity="warning" sx={{ mb: 3 }}>
      <AlertTitle>Action Required</AlertTitle>
      {expiringCertifications.length} certification(s) expiring soon
    </Alert>
  )}
  
  {blockedCompetencies.length > 0 && (
    <Alert severity="error" sx={{ mb: 3 }}>
      <AlertTitle>Work Blocked</AlertTitle>
      {blockedCompetencies.length} expired competency(s) preventing work
    </Alert>
  )}
  
  {/* Stats Cards */}
  <Grid container spacing={2} sx={{ mb: 4 }}>
    <Grid item xs={6} md={3}>
      <Card>
        <CardContent>
          <Typography variant="overline" color="text.secondary">
            Active Competencies
          </Typography>
          <Typography variant="h3" color="success.main">
            12
          </Typography>
        </CardContent>
      </Card>
    </Grid>
    <Grid item xs={6} md={3}>
      <Card>
        <CardContent>
          <Typography variant="overline" color="text.secondary">
            Expiring Soon
          </Typography>
          <Typography variant="h3" color="warning.main">
            2
          </Typography>
        </CardContent>
      </Card>
    </Grid>
    <Grid item xs={6} md={3}>
      <Card>
        <CardContent>
          <Typography variant="overline" color="text.secondary">
            Training In Progress
          </Typography>
          <Typography variant="h3" color="info.main">
            1
          </Typography>
        </CardContent>
      </Card>
    </Grid>
    <Grid item xs={6} md={3}>
      <Card>
        <CardContent>
          <Typography variant="overline" color="text.secondary">
            Assigned Training
          </Typography>
          <Typography variant="h3" color="primary.main">
            3
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  </Grid>
  
  {/* Tabs */}
  <Tabs value={tab} onChange={(e, v) => setTab(v)}>
    <Tab label="My Competencies" />
    <Tab label="Required Training" />
    <Tab label="In Progress" />
    <Tab label="Completed" />
  </Tabs>
  
  {/* Competencies Tab */}
  {tab === 0 && (
    <Grid container spacing={2} sx={{ mt: 2 }}>
      {competencies.map(comp => (
        <Grid item xs={12} md={6} lg={4} key={comp.id}>
          <CompetencyCard
            name={comp.name}
            level={comp.level}
            status={comp.status}
            expiresAt={comp.expiresAt}
            issuedBy={comp.issuedBy}
            workCenters={comp.workCenters}
          />
        </Grid>
      ))}
    </Grid>
  )}
  
  {/* Required Training Tab */}
  {tab === 1 && (
    <List>
      {requiredTraining.map(course => (
        <ListItem
          key={course.id}
          secondaryAction={
            <Button variant="contained" onClick={() => enroll(course.id)}>
              Start
            </Button>
          }
        >
          <ListItemAvatar>
            <Avatar sx={{ bgcolor: getPriorityColor(course.priority) }}>
              <SchoolIcon />
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={course.name}
            secondary={
              <>
                {course.duration} • {course.format} • 
                {course.dueDate && ` Due: ${formatDate(course.dueDate)}`}
              </>
            }
          />
        </ListItem>
      ))}
    </List>
  )}
</Box>
```

### G.3 Competency Card Component

```jsx
function CompetencyCard({ name, level, status, expiresAt, issuedBy, workCenters }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'QUALIFIED': return 'success';
      case 'AUTHORIZED': return 'info';
      case 'EXPIRING_SOON': return 'warning';
      case 'EXPIRED': case 'BLOCKED': return 'error';
      case 'SUSPENDED': return 'error';
      default: return 'default';
    }
  };
  
  const getLevelIcon = (level) => {
    switch (level) {
      case 'AWARE': return <VisibilityIcon />;
      case 'AUTHORIZED': return <SupervisedUserCircleIcon />;
      case 'QUALIFIED': return <VerifiedIcon />;
      case 'TRAINER': return <SchoolIcon />;
      default: return <HelpIcon />;
    }
  };
  
  return (
    <Card 
      variant="outlined"
      sx={{ 
        borderLeft: 4, 
        borderColor: `${getStatusColor(status)}.main` 
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            {name}
          </Typography>
          <Chip
            label={status.replace('_', ' ')}
            color={getStatusColor(status)}
            size="small"
          />
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          {getLevelIcon(level)}
          <Typography variant="body2" sx={{ ml: 1 }}>
            {level}
          </Typography>
        </Box>
        
        {expiresAt && (
          <Typography variant="body2" color="text.secondary">
            Expires: {formatDate(expiresAt)}
            {status === 'EXPIRING_SOON' && (
              <Chip 
                label={`${daysUntil(expiresAt)} days`} 
                color="warning" 
                size="small" 
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
        )}
        
        <Typography variant="caption" color="text.secondary" display="block">
          Issued by: {issuedBy}
        </Typography>
        
        {workCenters.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Valid for:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
              {workCenters.map(wc => (
                <Chip 
                  key={wc.id} 
                  label={wc.name} 
                  size="small" 
                  variant="outlined" 
                />
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
      
      {(status === 'EXPIRING_SOON' || status === 'EXPIRED') && (
        <CardActions>
          <Button size="small" color="primary">
            Start Recertification
          </Button>
        </CardActions>
      )}
    </Card>
  );
}
```

### G.4 Supervisor Team View

```jsx
<Box sx={{ p: 3 }}>
  <Typography variant="h4" gutterBottom>
    Team Training Status
  </Typography>
  
  {/* Team Summary */}
  <Grid container spacing={2} sx={{ mb: 3 }}>
    <Grid item xs={12} md={8}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Competency Coverage
        </Typography>
        <CompetencyHeatMap 
          team={team}
          competencies={requiredCompetencies}
        />
      </Paper>
    </Grid>
    <Grid item xs={12} md={4}>
      <Paper sx={{ p: 2, height: '100%' }}>
        <Typography variant="h6" gutterBottom>
          Expiring This Month
        </Typography>
        <List dense>
          {expiringThisMonth.map(item => (
            <ListItem key={item.id}>
              <ListItemAvatar>
                <Avatar src={item.user.avatar} />
              </ListItemAvatar>
              <ListItemText
                primary={item.user.name}
                secondary={
                  <>
                    {item.competency.name}
                    <br />
                    Expires: {formatDate(item.expiresAt)}
                  </>
                }
              />
              <ListItemSecondaryAction>
                <IconButton onClick={() => assignRecert(item)}>
                  <AssignmentIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Paper>
    </Grid>
  </Grid>
  
  {/* Team Table */}
  <Paper sx={{ p: 2 }}>
    <Typography variant="h6" gutterBottom>
      All Team Members
    </Typography>
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Employee</TableCell>
            <TableCell>Role</TableCell>
            <TableCell align="center">Active</TableCell>
            <TableCell align="center">Expiring</TableCell>
            <TableCell align="center">Blocked</TableCell>
            <TableCell align="center">In Training</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {team.map(member => (
            <TableRow key={member.id}>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar src={member.avatar} sx={{ mr: 1 }} />
                  {member.name}
                </Box>
              </TableCell>
              <TableCell>{member.role}</TableCell>
              <TableCell align="center">
                <Chip label={member.activeCount} color="success" size="small" />
              </TableCell>
              <TableCell align="center">
                {member.expiringCount > 0 ? (
                  <Chip label={member.expiringCount} color="warning" size="small" />
                ) : '-'}
              </TableCell>
              <TableCell align="center">
                {member.blockedCount > 0 ? (
                  <Chip label={member.blockedCount} color="error" size="small" />
                ) : '-'}
              </TableCell>
              <TableCell align="center">
                {member.inTrainingCount > 0 ? (
                  <Chip label={member.inTrainingCount} color="info" size="small" />
                ) : '-'}
              </TableCell>
              <TableCell>
                <IconButton onClick={() => viewDetails(member)}>
                  <VisibilityIcon />
                </IconButton>
                <IconButton onClick={() => assignTraining(member)}>
                  <AddIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </Paper>
</Box>
```

### G.5 EHS Dashboard

```jsx
<Box sx={{ p: 3 }}>
  <Typography variant="h4" gutterBottom>
    Training & Competency Compliance
  </Typography>
  
  {/* Key Metrics */}
  <Grid container spacing={2} sx={{ mb: 3 }}>
    <Grid item xs={6} md={3}>
      <Card>
        <CardContent>
          <Typography variant="overline">Overall Compliance</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h3" color="success.main">94%</Typography>
            <TrendingUpIcon color="success" sx={{ ml: 1 }} />
          </Box>
        </CardContent>
      </Card>
    </Grid>
    <Grid item xs={6} md={3}>
      <Card>
        <CardContent>
          <Typography variant="overline">Critical Gaps</Typography>
          <Typography variant="h3" color="error.main">3</Typography>
          <Typography variant="caption">High-risk competencies missing</Typography>
        </CardContent>
      </Card>
    </Grid>
    <Grid item xs={6} md={3}>
      <Card>
        <CardContent>
          <Typography variant="overline">Jobs Blocked (MTD)</Typography>
          <Typography variant="h3" color="warning.main">12</Typography>
          <Typography variant="caption">Due to competency gaps</Typography>
        </CardContent>
      </Card>
    </Grid>
    <Grid item xs={6} md={3}>
      <Card>
        <CardContent>
          <Typography variant="overline">Expiring (30 days)</Typography>
          <Typography variant="h3" color="info.main">28</Typography>
          <Typography variant="caption">Across all branches</Typography>
        </CardContent>
      </Card>
    </Grid>
  </Grid>
  
  {/* Critical Gaps Alert */}
  <Alert severity="error" sx={{ mb: 3 }}>
    <AlertTitle>Critical Coverage Gaps</AlertTitle>
    <List dense>
      <ListItem>
        Branch: Detroit → Only 1 qualified crane operator (minimum 2 required)
      </ListItem>
      <ListItem>
        Branch: Chicago → 2 operators with expired LOTO, currently working saw line
      </ListItem>
      <ListItem>
        Branch: Toledo → No qualified forklift trainer (cannot certify new operators)
      </ListItem>
    </List>
    <Button color="inherit" size="small">View Details & Assign Training</Button>
  </Alert>
  
  {/* Compliance by Branch */}
  <Paper sx={{ p: 2, mb: 3 }}>
    <Typography variant="h6" gutterBottom>
      Compliance by Branch
    </Typography>
    <BranchComplianceChart data={branchData} />
  </Paper>
  
  {/* Expiry Trend */}
  <Paper sx={{ p: 2 }}>
    <Typography variant="h6" gutterBottom>
      Certification Expiry Forecast (90 Days)
    </Typography>
    <ExpiryForecastChart data={expiryForecast} />
  </Paper>
</Box>
```

---

## H) Data Model

### H.1 Complete Prisma Schema

```prisma
// ============================================
// TRAINING & COMPETENCY DATA MODEL
// ============================================

// Training Content

model TrainingCourse {
  id                    String    @id @default(uuid())
  code                  String    @unique
  name                  String
  description           String?
  
  // Content
  format                TrainingFormat
  duration              Int       // minutes
  modules               TrainingModule[]
  assessment            Assessment?
  
  // Competency Link
  targetCompetencyId    String
  targetCompetency      Competency @relation(fields: [targetCompetencyId], references: [id])
  
  // Prerequisites
  prerequisiteCourseIds String[]
  
  // Certification settings
  recertIntervalMonths  Int       @default(12)
  gracePeriodDays       Int       @default(7)
  
  // Status
  status                CourseStatus @default(DRAFT)
  version               Int       @default(1)
  
  // Metadata
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  createdBy             String
  
  assignments           TrainingAssignment[]
  completions           TrainingCompletion[]
  
  @@index([targetCompetencyId])
  @@index([status])
}

enum TrainingFormat {
  ONLINE
  CLASSROOM
  OJT
  BLENDED
  VIDEO_ONLY
}

enum CourseStatus {
  DRAFT
  ACTIVE
  RETIRED
}

model TrainingModule {
  id              String    @id @default(uuid())
  courseId        String
  course          TrainingCourse @relation(fields: [courseId], references: [id])
  
  sequence        Int
  name            String
  description     String?
  
  type            ModuleType
  contentUrl      String?
  contentData     Json?     // For inline content
  
  duration        Int       // minutes
  passingScore    Int?      // For quiz modules
  required        Boolean   @default(true)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  completions     ModuleCompletion[]
  
  @@unique([courseId, sequence])
  @@index([courseId])
}

enum ModuleType {
  VIDEO
  TEXT
  INTERACTIVE
  QUIZ
  DOCUMENT
  PRACTICAL_GUIDE
}

model Assessment {
  id                    String    @id @default(uuid())
  courseId              String    @unique
  course                TrainingCourse @relation(fields: [courseId], references: [id])
  
  type                  AssessmentType
  passingScore          Int       // Percentage
  maxAttempts           Int       @default(3)
  timeLimit             Int?      // minutes
  
  // Question Bank (for written)
  questions             Json?     // Array of question objects
  randomize             Boolean   @default(true)
  questionsToShow       Int?      // Subset of question bank
  
  // Practical Checklist
  practicalChecklist    Json?     // Array of checklist items
  evaluatorRoleRequired String?   // Role code that can evaluate
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  results               AssessmentResult[]
}

enum AssessmentType {
  WRITTEN
  PRACTICAL
  BOTH
}

// Competency Definitions

model Competency {
  id                    String    @id @default(uuid())
  code                  String    @unique
  name                  String
  description           String?
  
  category              CompetencyCategory
  hazardLevel           HazardLevel
  
  // Certification settings (can override course)
  recertIntervalMonths  Int?
  gracePeriodDays       Int?
  
  // Status
  status                String    @default("ACTIVE")
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  trainingCourses       TrainingCourse[]
  requirements          CompetencyRequirement[]
  certifications        Certification[]
  
  @@index([category])
  @@index([hazardLevel])
}

enum CompetencyCategory {
  EQUIPMENT_OPERATION
  PROCESS_SAFETY
  HAZARD_SPECIFIC
  PERMIT_RELATED
  GENERAL_SAFETY
  EMERGENCY_RESPONSE
}

enum HazardLevel {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

model CompetencyRequirement {
  id                    String    @id @default(uuid())
  competencyId          String
  competency            Competency @relation(fields: [competencyId], references: [id])
  
  // Requirement Context
  roleCode              String?
  workCenterId          String?
  workCenterTypeCode    String?
  taskTypeCode          String?
  assetId               String?
  assetTypeCode         String?
  materialTypeCode      String?
  
  // Required Level
  requiredLevel         CompetencyLevel
  
  // Priority for display
  priority              Int       @default(100)
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  @@index([competencyId])
  @@index([roleCode])
  @@index([workCenterId])
  @@index([taskTypeCode])
}

enum CompetencyLevel {
  AWARE
  AUTHORIZED
  QUALIFIED
  TRAINER
}

// Training Tracking

model TrainingAssignment {
  id                    String    @id @default(uuid())
  userId                String
  courseId              String
  course                TrainingCourse @relation(fields: [courseId], references: [id])
  
  status                AssignmentStatus @default(ASSIGNED)
  
  // Assignment Details
  assignedBy            String
  assignedAt            DateTime  @default(now())
  dueDate               DateTime?
  priority              AssignmentPriority @default(NORMAL)
  reason                String?
  
  // Progress
  startedAt             DateTime?
  completedAt           DateTime?
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  completion            TrainingCompletion?
  moduleCompletions     ModuleCompletion[]
  
  @@unique([userId, courseId])
  @@index([userId])
  @@index([status])
  @@index([dueDate])
}

enum AssignmentStatus {
  ASSIGNED
  IN_PROGRESS
  PENDING_ASSESSMENT
  COMPLETED
  VERIFIED
  ACTIVE
  EXPIRED
  ABANDONED
  FAILED
}

enum AssignmentPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}

model ModuleCompletion {
  id                    String    @id @default(uuid())
  assignmentId          String
  assignment            TrainingAssignment @relation(fields: [assignmentId], references: [id])
  moduleId              String
  module                TrainingModule @relation(fields: [moduleId], references: [id])
  
  status                String    @default("NOT_STARTED")
  score                 Int?      // For quiz modules
  attempts              Int       @default(0)
  
  startedAt             DateTime?
  completedAt           DateTime?
  
  @@unique([assignmentId, moduleId])
  @@index([assignmentId])
}

model TrainingCompletion {
  id                    String    @id @default(uuid())
  assignmentId          String    @unique
  assignment            TrainingAssignment @relation(fields: [assignmentId], references: [id])
  userId                String
  courseId              String
  course                TrainingCourse @relation(fields: [courseId], references: [id])
  
  completedAt           DateTime  @default(now())
  
  // Assessment Result Link
  assessmentResultId    String?   @unique
  assessmentResult      AssessmentResult? @relation(fields: [assessmentResultId], references: [id])
  
  // Verification
  verifiedBy            String?
  verifiedAt            DateTime?
  
  createdAt             DateTime  @default(now())
  
  certification         Certification?
  
  @@index([userId])
  @@index([courseId])
}

model AssessmentResult {
  id                    String    @id @default(uuid())
  assessmentId          String
  assessment            Assessment @relation(fields: [assessmentId], references: [id])
  userId                String
  
  attemptNumber         Int
  score                 Int       // Percentage
  passed                Boolean
  
  // Detailed Results
  answers               Json?     // For written
  practicalResults      Json?     // For practical
  evaluatorId           String?   // For practical
  evaluatorNotes        String?
  
  startedAt             DateTime
  completedAt           DateTime
  
  trainingCompletion    TrainingCompletion?
  
  @@index([assessmentId])
  @@index([userId])
}

// Certifications

model Certification {
  id                    String    @id @default(uuid())
  userId                String
  competencyId          String
  competency            Competency @relation(fields: [competencyId], references: [id])
  
  // Link to training
  trainingCompletionId  String?   @unique
  trainingCompletion    TrainingCompletion? @relation(fields: [trainingCompletionId], references: [id])
  
  // Certification Details
  level                 CompetencyLevel
  status                CertificationStatus @default(ACTIVE)
  
  issuedAt              DateTime  @default(now())
  expiresAt             DateTime
  issuedBy              String    // User ID of evaluator
  
  // Grace Period
  graceEndsAt           DateTime?
  
  // Suspension/Revocation
  suspendedAt           DateTime?
  suspendedBy           String?
  suspendedReason       String?
  revokedAt             DateTime?
  revokedBy             String?
  revokedReason         String?
  
  // Metadata
  certificateNumber     String    @unique
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  auditEvents           CompetencyAuditEvent[]
  
  @@index([userId])
  @@index([competencyId])
  @@index([status])
  @@index([expiresAt])
}

enum CertificationStatus {
  PENDING
  AUTHORIZED
  ACTIVE      // QUALIFIED
  EXPIRING_SOON
  GRACE_WARN
  EXPIRED
  BLOCKED
  SUSPENDED
  REVOKED
}

// Audit Trail

model CompetencyAuditEvent {
  id                    String    @id @default(uuid())
  
  // Context
  userId                String?
  certificationId       String?
  certification         Certification? @relation(fields: [certificationId], references: [id])
  operationId           String?
  jobId                 String?
  
  // Event
  eventType             String
  eventDescription      String
  eventData             Json?
  
  // Result
  result                String    // ALLOWED, BLOCKED, WARNING
  blocks                Json?     // Array of block reasons
  warnings              Json?     // Array of warnings
  
  // Actor
  performedBy           String?
  performedByType       String    // SYSTEM, USER, AI
  
  // Immutability
  previousHash          String?
  hash                  String
  
  createdAt             DateTime  @default(now())
  
  @@index([userId, createdAt])
  @@index([certificationId])
  @@index([eventType, createdAt])
  @@index([jobId])
}
```

### H.2 Entity Relationships

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ENTITY RELATIONSHIP DIAGRAM                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  TrainingCourse ─────────┬───────────────▶ Competency               │
│       │                  │                     │                     │
│       │                  │                     │                     │
│       ▼                  │                     ▼                     │
│  TrainingModule          │              CompetencyRequirement       │
│                          │               (Role, WorkCenter, Task)    │
│       │                  │                                          │
│       │                  ▼                                          │
│       │             Assessment                                       │
│       │                  │                                          │
│       ▼                  ▼                                          │
│  ModuleCompletion   AssessmentResult                                │
│       │                  │                                          │
│       │                  │                                          │
│       └────────┬─────────┘                                          │
│                │                                                     │
│                ▼                                                     │
│       TrainingAssignment ────▶ TrainingCompletion                   │
│                                       │                              │
│                                       │                              │
│                                       ▼                              │
│                               Certification ──────▶ CompetencyAudit │
│                                       │                              │
│                                       │                              │
│                                       ▼                              │
│                                     User                             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## I) APIs & Enforcement Hooks

### I.1 API Endpoints

#### Training Courses

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/training/courses` | List all courses (with filters) |
| GET | `/api/training/courses/:id` | Get course details with modules |
| POST | `/api/training/courses` | Create new course (Admin) |
| PUT | `/api/training/courses/:id` | Update course (Admin) |
| POST | `/api/training/courses/:id/publish` | Publish course (Admin) |
| POST | `/api/training/courses/:id/retire` | Retire course (Admin) |

#### Training Assignments

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/training/assignments` | List assignments (for user or team) |
| GET | `/api/training/assignments/:id` | Get assignment details |
| POST | `/api/training/assignments` | Assign training to user(s) |
| POST | `/api/training/assignments/:id/start` | Start training |
| POST | `/api/training/assignments/:id/modules/:moduleId/complete` | Complete module |
| POST | `/api/training/assignments/:id/submit-assessment` | Submit assessment |
| DELETE | `/api/training/assignments/:id` | Cancel assignment |

#### Training Completions

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/training/completions` | List completions (for user or all) |
| GET | `/api/training/completions/:id` | Get completion details |
| POST | `/api/training/completions/:id/verify` | Verify completion (Evaluator) |

#### Competencies

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/competencies` | List all competencies |
| GET | `/api/competencies/:id` | Get competency details |
| POST | `/api/competencies` | Create competency (Admin) |
| PUT | `/api/competencies/:id` | Update competency (Admin) |

#### Competency Requirements

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/competency-requirements` | List requirements (with filters) |
| POST | `/api/competency-requirements` | Create requirement (Admin) |
| PUT | `/api/competency-requirements/:id` | Update requirement (Admin) |
| DELETE | `/api/competency-requirements/:id` | Delete requirement (Admin) |

#### Certifications

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/certifications` | List certifications (for user or all) |
| GET | `/api/certifications/:id` | Get certification details |
| POST | `/api/certifications/:id/suspend` | Suspend certification (EHS) |
| POST | `/api/certifications/:id/reinstate` | Reinstate certification (EHS) |
| POST | `/api/certifications/:id/revoke` | Revoke certification (EHS) |

#### Job Validation

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/jobs/validate-competency` | Validate operator for job/operation |
| GET | `/api/jobs/:jobId/competency-status` | Get competency status for job |
| GET | `/api/operators/:id/eligible-operations` | Get operations user is qualified for |

### I.2 Enforcement Hook

The primary enforcement hook is called before any operation starts:

```javascript
// POST /api/jobs/validate-competency
// Request body:
{
  "operatorId": "user-uuid",
  "operationId": "operation-uuid"
}

// Response (success):
{
  "allowed": true,
  "warnings": [
    {
      "type": "COMPETENCY_GRACE_PERIOD",
      "competencyName": "LOTO Awareness",
      "graceEndsAt": "2026-02-14T00:00:00Z",
      "message": "Recertify within 10 days"
    }
  ]
}

// Response (blocked):
{
  "allowed": false,
  "blocks": [
    {
      "type": "MISSING_COMPETENCY",
      "competencyId": "comp-uuid",
      "competencyName": "Vertical Bandsaw Operation",
      "requiredLevel": "QUALIFIED",
      "message": "Missing required competency: Vertical Bandsaw Operation",
      "trainingCourseId": "course-uuid",
      "trainingCourseName": "SAW-201 Vertical Bandsaw Operation",
      "enrollUrl": "/training/enroll/course-uuid"
    },
    {
      "type": "COMPETENCY_EXPIRED",
      "competencyId": "comp-uuid-2",
      "competencyName": "Aluminum Cutting Hazards",
      "expiredAt": "2026-01-15T00:00:00Z",
      "message": "Competency expired: Aluminum Cutting Hazards",
      "action": "Complete recertification training"
    }
  ],
  "supervisorNotified": true,
  "canEnroll": [
    {
      "courseId": "course-uuid",
      "courseName": "SAW-201 Vertical Bandsaw Operation",
      "duration": 120
    }
  ]
}
```

### I.3 Integration with Shop Floor App

```javascript
// In Shop Floor Execution - Operation Start
async function handleOperationStart(operatorId, operationId) {
  // 1. Validate competencies
  const validation = await fetch('/api/jobs/validate-competency', {
    method: 'POST',
    body: JSON.stringify({ operatorId, operationId })
  }).then(r => r.json());
  
  if (!validation.allowed) {
    // Show block dialog
    showBlockedDialog({
      title: 'Cannot Start Operation',
      blocks: validation.blocks,
      actions: [
        { label: 'Ask AI Assistant', onClick: () => openAIChat(validation) },
        { label: 'Contact Supervisor', onClick: () => notifySupervisor() },
        { label: 'Return to Queue', onClick: () => navigate('/queue') }
      ]
    });
    return;
  }
  
  if (validation.warnings.length > 0) {
    // Show warnings but allow to proceed
    showWarningsDialog({
      title: 'Proceed with Caution',
      warnings: validation.warnings,
      onProceed: () => startOperation(operationId)
    });
    return;
  }
  
  // All clear - start operation
  await startOperation(operationId);
}
```

### I.4 Integration with Dispatch Engine

```javascript
// In Dispatch Engine - Pre-dispatch validation
async function validateBeforeDispatch(jobId, workCenterId, assignedOperatorId) {
  const operations = await getJobOperations(jobId);
  
  for (const op of operations) {
    if (op.workCenterId === workCenterId) {
      const validation = await validateOperatorForOperation(
        assignedOperatorId, 
        op.id
      );
      
      if (!validation.allowed) {
        return {
          canDispatch: false,
          reason: 'COMPETENCY_BLOCK',
          blocks: validation.blocks,
          operationId: op.id
        };
      }
    }
  }
  
  return { canDispatch: true };
}
```

---

## J) Audit & Evidence

### J.1 Audit Event Types

| Event Type | Description | Data Captured |
|------------|-------------|---------------|
| `TRAINING_ASSIGNED` | Training assigned to user | assignedBy, courseId, dueDate |
| `TRAINING_STARTED` | User started training | timestamp |
| `MODULE_COMPLETED` | User completed module | moduleId, score (if quiz) |
| `ASSESSMENT_ATTEMPTED` | User attempted assessment | attemptNumber, score |
| `ASSESSMENT_PASSED` | User passed assessment | score, timestamp |
| `ASSESSMENT_FAILED` | User failed assessment | score, attemptNumber |
| `PRACTICAL_EVALUATED` | Practical evaluated | evaluatorId, result, notes |
| `COMPETENCY_VERIFIED` | Competency verified by evaluator | verifierId, level |
| `CERTIFICATION_ISSUED` | Certification issued | certId, expiresAt |
| `CERTIFICATION_EXPIRING` | Certification expiring soon | daysRemaining |
| `CERTIFICATION_EXPIRED` | Certification expired | graceEndsAt |
| `CERTIFICATION_BLOCKED` | Certification blocked (past grace) | - |
| `CERTIFICATION_SUSPENDED` | Certification suspended | reason, suspendedBy |
| `CERTIFICATION_REINSTATED` | Certification reinstated | reinstatedBy |
| `CERTIFICATION_REVOKED` | Certification revoked | reason, revokedBy |
| `JOB_VALIDATION_PASSED` | Operator validated for job | operationId |
| `JOB_VALIDATION_BLOCKED` | Operator blocked from job | operationId, blocks |
| `JOB_VALIDATION_WARNING` | Operator warned (grace period) | warnings |
| `OVERRIDE_ATTEMPTED` | Supervisor attempted override | DENIED |

### J.2 Audit Record Structure

```javascript
{
  id: "audit-uuid",
  
  // Context
  userId: "user-uuid",
  certificationId: "cert-uuid",
  operationId: "op-uuid",
  jobId: "job-uuid",
  
  // Event
  eventType: "JOB_VALIDATION_BLOCKED",
  eventDescription: "Operator blocked from starting operation due to missing competency",
  eventData: {
    operatorName: "John Smith",
    operationName: "Cut Aluminum Plate",
    workCenter: "SAW-002",
    missingCompetencies: [
      { code: "COMP-VSAW-OP", name: "Vertical Bandsaw Operation", requiredLevel: "QUALIFIED" }
    ]
  },
  
  // Result
  result: "BLOCKED",
  blocks: [
    {
      type: "MISSING_COMPETENCY",
      competencyCode: "COMP-VSAW-OP",
      competencyName: "Vertical Bandsaw Operation"
    }
  ],
  
  // Actor
  performedBy: "system",
  performedByType: "SYSTEM",
  
  // Immutability
  previousHash: "abc123...",
  hash: "def456...",
  
  createdAt: "2026-02-04T14:30:00Z"
}
```

### J.3 Evidence Requirements

| Evidence Type | Retention | Format | Immutability |
|---------------|-----------|--------|--------------|
| Training completion | 7 years | Database + PDF certificate | Hash-chained |
| Assessment results | 7 years | Database + PDF report | Hash-chained |
| Practical evaluation | 7 years | Database + evaluator signature | Hash-chained |
| Certification record | 7 years | Database + PDF certificate | Hash-chained |
| Job validation logs | 3 years | Database | Hash-chained |
| Expiry notifications | 3 years | Database | Hash-chained |
| Override attempts | 7 years | Database | Hash-chained |

### J.4 Audit Export Packages

#### Individual Operator Package

```
GET /api/audit/operator-package?userId=XXX&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD

Returns ZIP:
├── summary.pdf                    # Competency summary
├── certifications/
│   ├── CERT-001.pdf              # Each certification
│   ├── CERT-002.pdf
│   └── ...
├── training_completions/
│   ├── completion-001.pdf        # Each completion with assessment
│   └── ...
├── validation_log.csv            # All job validations
├── audit_events.csv              # All audit events
└── integrity_verification.pdf    # Hash chain verification
```

#### Compliance Report Package

```
GET /api/audit/compliance-package?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD

Returns ZIP:
├── executive_summary.pdf
├── compliance_by_branch.csv
├── compliance_by_competency.csv
├── expired_certifications.csv
├── blocked_jobs.csv
├── training_completion_rate.csv
├── high_risk_gaps.csv
└── all_certifications.csv
```

---

## K) Testing & Validation

### K.1 Test Cases

#### TC-001: Operator with Expired Training Blocked

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Operator has SAW-001 competency expiring Feb 1 | Status: EXPIRING_SOON |
| 2 | Feb 1 passes | Status: EXPIRED (grace period 7 days) |
| 3 | Feb 3: Operator tries to start saw job | Warning shown, work allowed |
| 4 | Feb 8 passes | Status: BLOCKED |
| 5 | Feb 9: Operator tries to start saw job | Work BLOCKED, shows reason |
| 6 | Supervisor notified | Notification sent |
| 7 | Operator cannot start job | Only option: enroll in training |

#### TC-002: Supervisor Cannot Override

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Operator blocked due to expired competency | Block active |
| 2 | Supervisor clicks "Override" button | Button disabled or not present |
| 3 | Supervisor tries API override | Returns 403 + DENIED |
| 4 | Override attempt logged | Audit event created |
| 5 | EHS notified | Notification sent to EHS |

#### TC-003: Competency Expires Mid-Shift

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Operator starts job at 8am | Job starts normally |
| 2 | Competency expires at 12pm (during job) | Current operation continues |
| 3 | Operator completes operation at 1pm | Operation completes normally |
| 4 | Operator tries to start next operation | Blocked (competency now expired) |
| 5 | In-progress work not interrupted | No automatic stop |
| 6 | No new work allowed | All subsequent work blocked |

#### TC-004: New Asset Requires New Competency

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | SAW-005 added to system | Asset created |
| 2 | SAW-005 requires "Vertical Saw High-Capacity" competency | Requirement mapped |
| 3 | Operator qualified for SAW-001,002,003,004 | Has standard saw competencies |
| 4 | Job assigned to SAW-005 | Job scheduled |
| 5 | Operator tries to start | BLOCKED: Missing "Vertical Saw High-Capacity" |
| 6 | System suggests training | Shows course to enroll |

#### TC-005: AI Recommendation Accuracy

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Operator assigned to new work center | Work center change detected |
| 2 | AI analyzes required competencies | Compares to current certs |
| 3 | AI generates training recommendations | Lists all required training |
| 4 | Recommendations match policy | 100% match to requirement rules |
| 5 | AI cannot certify | No certification created by AI |

#### TC-006: Audit Export Completeness

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Request audit package for operator | Package generated |
| 2 | Verify all certifications included | 100% included |
| 3 | Verify all completions included | 100% included |
| 4 | Verify all validation events included | 100% included |
| 5 | Verify hash chain integrity | All hashes valid |
| 6 | Package matches database | Bit-for-bit accuracy |

#### TC-007: AUTHORIZED Level Requires Supervision

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Operator has AUTHORIZED level for saw | Not yet QUALIFIED |
| 2 | Task requires QUALIFIED | Check requirement |
| 3 | Operator tries to start alone | BLOCKED or SUPERVISED required |
| 4 | Qualified operator present | Supervisor confirms |
| 5 | Work allowed with supervision flag | Job starts, logged as supervised |

### K.2 Automated Test Coverage

| Test Category | Count | Pass Criteria |
|---------------|-------|---------------|
| Unit Tests (State Machine) | 50+ | 100% pass |
| Unit Tests (Requirement Matching) | 30+ | 100% pass |
| Integration Tests (Validation Flow) | 25+ | 100% pass |
| Integration Tests (Training Flow) | 20+ | 100% pass |
| E2E Tests (Happy Path) | 15 | 100% pass |
| E2E Tests (Block Scenarios) | 20 | 100% pass |
| Performance Tests (Validation <100ms) | 5 | 100% pass |
| Security Tests (No Override) | 10 | 100% pass |
| Audit Tests (Completeness) | 10 | 100% pass |

---

## L) Rollout & Go/No-Go Criteria

### L.1 Phased Rollout Plan

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ROLLOUT PHASES                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  PHASE 0: DATA PREPARATION (2 weeks)                                 │
│  ───────────────────────────────────                                 │
│  - Import existing training records                                  │
│  - Create competency mappings                                        │
│  - Verify all operator certifications                                │
│  - Identify and resolve gaps                                         │
│                                                                      │
│  PHASE 1: SHADOW MODE (2 weeks)                                      │
│  ──────────────────────────────                                      │
│  - System runs alongside existing process                            │
│  - Logs what WOULD be blocked (no enforcement)                       │
│  - Review logs for false positives                                   │
│  - Tune requirements                                                 │
│                                                                      │
│  PHASE 2: SOFT ENFORCEMENT (2 weeks)                                 │
│  ────────────────────────────────────                                │
│  - Warnings shown but work allowed                                   │
│  - Supervisors notified of gaps                                      │
│  - Operators reminded of training needs                              │
│  - Measure compliance rate                                           │
│                                                                      │
│  PHASE 3: PILOT BRANCH - FULL ENFORCEMENT (4 weeks)                  │
│  ───────────────────────────────────────────────────                 │
│  - Select pilot branch (moderate volume)                             │
│  - Full enforcement (blocks active)                                  │
│  - EHS on-site for support                                           │
│  - Rapid response to issues                                          │
│                                                                      │
│  PHASE 4: REGIONAL ROLLOUT (4 weeks)                                 │
│  ────────────────────────────────                                    │
│  - 3-5 additional branches                                           │
│  - Full enforcement                                                  │
│  - Monitor for issues                                                │
│                                                                      │
│  PHASE 5: FULL DEPLOYMENT (4 weeks)                                  │
│  ─────────────────────────────────                                   │
│  - All remaining branches                                            │
│  - Legacy system sunset                                              │
│  - Full audit capability                                             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### L.2 Communication Plan

#### 30 Days Before Enforcement

```
TO: All Operations Personnel
SUBJECT: New Competency Management System - Action Required

Starting [Date], we are implementing a new Safety Training Engine 
that will automatically verify competencies before job start.

WHAT'S CHANGING:
• The system will check your certifications before each job
• Expired or missing competencies will block job start
• Grace periods apply to some competencies
• AI Assistant available to explain requirements

ACTION REQUIRED:
1. Log in to the Training Portal at [URL]
2. Review your current competencies
3. Complete any expiring certifications BEFORE [enforcement date]

If you have questions, contact your supervisor or EHS.

Safety is everyone's responsibility. This system ensures we all
have the training needed to work safely.
```

### L.3 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Competency Coverage** | 100% | All operators have required competencies |
| **Zero Untrained Work** | 100% | No blocked-operation bypasses |
| **Training Completion Rate** | 95%+ | Assigned training completed on time |
| **Recertification Rate** | 98%+ | Certs renewed before expiry |
| **System Uptime** | 99.9% | Validation endpoint availability |
| **Validation Speed** | <100ms | 95th percentile response time |
| **Audit Completeness** | 100% | All required records captured |
| **False Positive Rate** | <1% | Incorrect blocks |
| **User Satisfaction** | >4.0/5.0 | Operator survey |

### L.4 Go/No-Go Criteria

#### Phase 1 (Shadow Mode) Exit Criteria

| Criterion | Threshold | Status |
|-----------|-----------|--------|
| All operators imported | 100% | ☐ |
| All competencies mapped | 100% | ☐ |
| False positive rate | <5% | ☐ |
| Validation performance | <200ms P95 | ☐ |
| Data migration verified | 100% accuracy | ☐ |

#### Phase 3 (Pilot Enforcement) Exit Criteria

| Criterion | Threshold | Status |
|-----------|-----------|--------|
| System uptime | >99% | ☐ |
| No false blocks | 0 confirmed | ☐ |
| Blocked jobs resolved same-day | 100% | ☐ |
| Operator satisfaction | >3.5/5.0 | ☐ |
| Supervisor adoption | 100% using system | ☐ |
| Audit export tested | 2 successful exports | ☐ |
| AI assistant functional | No policy violations | ☐ |

#### Full Deployment Go/No-Go

| Criterion | Threshold | Status |
|-----------|-----------|--------|
| Pilot success criteria met | All green | ☐ |
| Regional rollout success | 98% compliance | ☐ |
| All branches trained | 100% | ☐ |
| Executive sign-off | COO approved | ☐ |
| Legal review | Approved | ☐ |
| Union notification (if applicable) | Acknowledged | ☐ |

### L.5 Rollback Plan

If critical issues arise:

1. **Immediate**: Disable enforcement (shadow mode only)
2. **Short-term**: Allow supervisor override with logging
3. **Medium-term**: Fix issues, re-pilot
4. **Communication**: Notify all operators of temporary changes

**Rollback triggers**:
- >5 confirmed false blocks in 24 hours
- System downtime >30 minutes
- Critical gap discovered in competency mapping
- Legal or union objection

---

## Appendix A: Sample Competency Requirements

```yaml
# Work Center: SAW (All saw types)
saw_base_requirements:
  - competency: GENERAL_SAFETY
    level: AWARE
  - competency: PPE_HEARING
    level: QUALIFIED
  - competency: PPE_EYE
    level: QUALIFIED
  - competency: MACHINE_GUARDING_AWARENESS
    level: AWARE

# Work Center: SAW + Task: OPERATE
saw_operate_requirements:
  - competency: SAW_OPERATION
    level: QUALIFIED
    
# Work Center: SAW + Task: BLADE_CHANGE
saw_blade_change_requirements:
  - competency: SAW_OPERATION
    level: QUALIFIED
  - competency: BLADE_HANDLING
    level: QUALIFIED
  - competency: LOTO_AWARENESS
    level: AWARE

# Work Center: SAW + Task: MAINTENANCE
saw_maintenance_requirements:
  - competency: LOTO_AUTHORIZED
    level: QUALIFIED
  - competency: MECHANICAL_SAFETY
    level: QUALIFIED
  - competency: SAW_MAINTENANCE
    level: QUALIFIED

# Asset-specific override: SAW-002 (Vertical Bandsaw)
saw_002_requirements:
  - competency: VERTICAL_SAW_OPERATION
    level: QUALIFIED
    note: "Different controls and blade system than horizontal saws"

# Material-specific: Titanium
titanium_cutting_requirements:
  - competency: TITANIUM_FIRE_HAZARDS
    level: QUALIFIED
  - competency: FIRE_EXTINGUISHER_CLASS_D
    level: AWARE
```

---

## Appendix B: Assessment Question Bank Structure

```javascript
// Written Assessment Question Format
{
  id: "q-001",
  type: "MULTIPLE_CHOICE",
  question: "What is the FIRST step before performing maintenance on a bandsaw?",
  options: [
    { id: "a", text: "Unplug the power cord" },
    { id: "b", text: "Apply your personal lock to the energy isolation device" },
    { id: "c", text: "Notify your supervisor" },
    { id: "d", text: "Put on PPE" }
  ],
  correctAnswer: "b",
  explanation: "LOTO procedures require applying your personal lock FIRST before any other maintenance steps.",
  competencyTested: "LOTO_AUTHORIZED",
  difficulty: "MEDIUM",
  tags: ["loto", "maintenance", "safety"]
}

// Practical Evaluation Checklist Format
{
  id: "pc-001",
  name: "Forklift Pre-Trip Inspection",
  competencyTested: "FORKLIFT_OPERATION",
  items: [
    {
      id: "pc-001-01",
      description: "Checks tire condition and pressure",
      criticalItem: true,
      acceptanceCriteria: "All tires inspected, no damage or low pressure"
    },
    {
      id: "pc-001-02", 
      description: "Tests horn and warning devices",
      criticalItem: true,
      acceptanceCriteria: "Horn sounds clearly, backup alarm functional"
    },
    {
      id: "pc-001-03",
      description: "Checks fluid levels",
      criticalItem: false,
      acceptanceCriteria: "Oil, hydraulic fluid, coolant at proper levels"
    },
    // ... more items
  ],
  passingCriteria: {
    allCriticalItems: true,
    minimumNonCritical: 0.8  // 80% of non-critical
  }
}
```

---

## Document Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| EHS Director | _________________ | _______ | _________ |
| VP Operations | _________________ | _______ | _________ |
| Training Manager | _________________ | _______ | _________ |
| IT Director | _________________ | _______ | _________ |
| Legal Counsel | _________________ | _______ | _________ |
| Union Rep (if applicable) | _________________ | _______ | _________ |

---

*This document defines the complete Safety Training Engine specification. Implementation should follow the phased rollout plan with strict adherence to go/no-go criteria. No operator shall perform work without verified competency.*
