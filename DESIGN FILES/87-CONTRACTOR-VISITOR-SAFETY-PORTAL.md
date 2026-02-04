# 87 - Contractor & Visitor Safety Portal

> **Document Version**: 1.0  
> **Date**: February 4, 2026  
> **Author**: Senior Industrial Safety Systems Architect  
> **Status**: APPROVED FOR IMPLEMENTATION

---

## Executive Summary

This document defines the **Contractor & Visitor Safety Portal**—a comprehensive system for managing third-party access to service center facilities. The portal ensures that contractors, vendors, carriers, inspectors, and visitors are treated as **first-class safety participants** with full integration into the Safety Module, Stop-Work Authority, Dispatch Engine, and Audit systems.

**Core Principle**: No contractor or visitor shall bypass safety controls. All access is time-bound, location-bound, and auditable. Production work is blocked if contractor safety requirements are incomplete.

---

## A) Purpose & Scope

### A.1 Why Contractor/Visitor Safety is Critical

#### Third-Party Risk Profile

| Risk Factor | Consequence |
|-------------|-------------|
| **Unfamiliar with site hazards** | Higher incident probability |
| **Variable training quality** | Inconsistent safe behaviors |
| **Limited supervision** | Uncontrolled work practices |
| **Equipment variability** | Incompatible or unsafe tools |
| **Communication gaps** | Misunderstood scope, unauthorized work |
| **Compressed timelines** | Shortcuts, incomplete procedures |

#### Business & Legal Exposure

| Exposure Area | Impact |
|---------------|--------|
| **OSHA Multi-Employer Doctrine** | Controlling employer liable for contractor safety |
| **Workers' Compensation** | Misclassification creates direct liability |
| **General Liability Insurance** | Claims for contractor injuries on-site |
| **Property Damage** | Contractor actions damaging equipment/inventory |
| **Regulatory Citations** | Contractor violations cited against host |
| **Customer Audits** | Contractor management is audit criterion |
| **Reputation** | Contractor incidents reflect on company |

#### Insurance Requirements

Most commercial general liability (CGL) policies require:
- Verification of contractor insurance certificates
- Documented safety orientation
- Permit systems for high-risk work
- Supervision of contractor activities
- Incident reporting for all persons on-site

**Failure to document = policy defense for insurer.**

### A.2 Scope of Portal

#### In-Scope: Managed Third Parties

| Category | Examples | Duration |
|----------|----------|----------|
| **Single-Day Visitors** | Customers, sales reps, executives | Hours |
| **Recurring Contractors** | HVAC, IT support, janitorial | Ongoing |
| **Project Contractors** | Machine installation, facility upgrades | Days-weeks |
| **Emergency Contractors** | Breakdown repair, plumbing emergency | Immediate |
| **Carriers/Drivers** | Freight delivery, customer pickup | Hours |
| **Inspectors/Auditors** | Insurance, regulatory, customer | Hours-days |
| **Temporary Labor** | Staffing agency workers | Days-weeks |

#### Out-of-Scope

- Full-time employees (managed by HR/Safety Module)
- Candidates for interview (managed by HR)
- Public visitors to retail counter (if applicable)

---

## B) Contractor / Visitor Types

### B.1 Type Definitions

#### MAINTENANCE_CONTRACTOR

| Attribute | Value |
|-----------|-------|
| **Description** | General maintenance: HVAC, plumbing, facility repair |
| **Risk Level** | Medium |
| **Allowed Areas** | Maintenance areas, mechanical rooms, rooftops |
| **Restricted Areas** | Production floor (without escort), offices (without escort) |
| **Allowed Activities** | Repair, inspection, preventive maintenance |
| **Default Permits Required** | LOTO (if energy isolation), Hot Work (if welding/cutting) |
| **Escort Required** | No (after orientation) |
| **PPE Required** | Safety glasses, steel-toe boots, high-vis vest |
| **Insurance Required** | Yes - GL $1M, WC statutory |

#### ELECTRICAL_CONTRACTOR

| Attribute | Value |
|-----------|-------|
| **Description** | Licensed electricians for electrical work |
| **Risk Level** | High |
| **Allowed Areas** | Electrical rooms, panels, designated work areas |
| **Restricted Areas** | All areas without active permit |
| **Allowed Activities** | Electrical installation, repair, testing |
| **Default Permits Required** | LOTO (always), Electrical Work Permit |
| **Escort Required** | No (after orientation + permit) |
| **PPE Required** | Arc flash PPE (per hazard analysis), insulated gloves |
| **Insurance Required** | Yes - GL $2M, WC statutory |
| **Special Requirements** | Verify state electrical license |

#### RIGGING_CRANE_CONTRACTOR

| Attribute | Value |
|-----------|-------|
| **Description** | Crane operators, riggers for heavy lifts |
| **Risk Level** | Critical |
| **Allowed Areas** | Designated lift zones only |
| **Restricted Areas** | All areas outside lift plan |
| **Allowed Activities** | Rigging, crane operation, heavy lifts |
| **Default Permits Required** | Critical Lift Permit, Rigging Plan |
| **Escort Required** | Signal person/spotter required |
| **PPE Required** | Hard hat, steel-toe boots, high-vis, gloves |
| **Insurance Required** | Yes - GL $5M, WC statutory |
| **Special Requirements** | Crane certifications, rigging certs, lift plan |

#### HOT_WORK_CONTRACTOR

| Attribute | Value |
|-----------|-------|
| **Description** | Welders, cutters, brazing contractors |
| **Risk Level** | Critical |
| **Allowed Areas** | Designated hot work zones only |
| **Restricted Areas** | All areas without active permit |
| **Allowed Activities** | Welding, cutting, brazing, grinding |
| **Default Permits Required** | Hot Work Permit (always) |
| **Escort Required** | Fire watch required during + 30 min after |
| **PPE Required** | Welding hood, leather gloves, fire-resistant clothing |
| **Insurance Required** | Yes - GL $2M, WC statutory |
| **Special Requirements** | Welding certifications |

#### IT_VENDOR

| Attribute | Value |
|-----------|-------|
| **Description** | IT support, network, telecom vendors |
| **Risk Level** | Low |
| **Allowed Areas** | Server room, office areas, network closets |
| **Restricted Areas** | Production floor |
| **Allowed Activities** | IT maintenance, installation |
| **Default Permits Required** | None (unless entering MDF with power work) |
| **Escort Required** | No (after orientation) |
| **PPE Required** | None (office areas), safety glasses (if production) |
| **Insurance Required** | Yes - GL $1M |

#### CARRIER_DRIVER

| Attribute | Value |
|-----------|-------|
| **Description** | Truck drivers for delivery/pickup |
| **Risk Level** | Medium |
| **Allowed Areas** | Shipping/receiving dock, driver waiting area |
| **Restricted Areas** | Production floor, warehouse aisles, offices |
| **Allowed Activities** | Loading/unloading at dock, paperwork |
| **Default Permits Required** | None |
| **Escort Required** | No (dock area only), Yes (if entering warehouse) |
| **PPE Required** | Safety glasses, steel-toe boots (if exiting cab) |
| **Insurance Required** | Verified via carrier qualification |

#### INSPECTOR_AUDITOR

| Attribute | Value |
|-----------|-------|
| **Description** | Insurance, regulatory, customer auditors |
| **Risk Level** | Low |
| **Allowed Areas** | As required for audit scope |
| **Restricted Areas** | None (with escort) |
| **Allowed Activities** | Inspection, documentation review, interviews |
| **Default Permits Required** | None |
| **Escort Required** | Yes (always) |
| **PPE Required** | Full PPE if entering production (glasses, boots, vest) |
| **Insurance Required** | No (observational only) |

#### VISITOR_NONWORKING

| Attribute | Value |
|-----------|-------|
| **Description** | Customers, executives, tours, family members |
| **Risk Level** | Low |
| **Allowed Areas** | Offices, conference rooms, designated tour paths |
| **Restricted Areas** | Production floor (without escort + PPE) |
| **Allowed Activities** | Meeting, tour, observation |
| **Default Permits Required** | None |
| **Escort Required** | Yes (always in production) |
| **PPE Required** | Full PPE if entering production |
| **Insurance Required** | No |

### B.2 Type Summary Matrix

| Type | Risk | Permit | Escort | Insurance | Orientation |
|------|------|--------|--------|-----------|-------------|
| Maintenance Contractor | Medium | Conditional | No | Yes | Full |
| Electrical Contractor | High | LOTO + EWP | No | Yes | Full + Electrical |
| Rigging/Crane Contractor | Critical | Lift Permit | Spotter | Yes | Full + Rigging |
| Hot Work Contractor | Critical | Hot Work | Fire Watch | Yes | Full + Hot Work |
| IT Vendor | Low | None | No | Yes | Basic |
| Carrier/Driver | Medium | None | Conditional | Via carrier | Driver Safety |
| Inspector/Auditor | Low | None | Yes | No | Basic |
| Visitor (non-working) | Low | None | Yes | No | Visitor Safety |

---

## C) Identity & Access Model

### C.1 Access Control Framework

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CONTRACTOR ACCESS LAYERS                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  LAYER 1: IDENTITY                                                   │
│  ─────────────────                                                   │
│  - Pre-registration in portal                                        │
│  - Company verification                                              │
│  - Photo ID capture                                                  │
│  - Insurance certificate upload                                      │
│                                                                      │
│  LAYER 2: QUALIFICATION                                              │
│  ──────────────────────                                              │
│  - Safety orientation completed                                      │
│  - Required training verified                                        │
│  - Certifications validated                                          │
│  - Safety rules acknowledged                                         │
│                                                                      │
│  LAYER 3: AUTHORIZATION                                              │
│  ─────────────────────                                               │
│  - Sponsor approval                                                  │
│  - EHS approval (if high-risk)                                       │
│  - Time window assigned                                              │
│  - Location scope assigned                                           │
│                                                                      │
│  LAYER 4: PHYSICAL ACCESS                                            │
│  ────────────────────────                                            │
│  - Check-in at kiosk                                                 │
│  - Badge issued                                                      │
│  - Permit activated                                                  │
│  - Area access granted                                               │
│                                                                      │
│  LAYER 5: CONTINUOUS VERIFICATION                                    │
│  ────────────────────────────────                                    │
│  - Permit validity monitored                                         │
│  - Time window monitored                                             │
│  - Location compliance (if tracked)                                  │
│  - Stop-Work Authority applies                                       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### C.2 Pre-Registration Requirements

All contractors and visitors must be **pre-registered** by:
1. **Sponsor (internal employee)** who invites them, OR
2. **Self-registration** which requires sponsor approval

Pre-registration captures:
- Full legal name
- Company name
- Contact information
- Purpose of visit
- Requested date(s) and time window
- Areas to be accessed
- Work to be performed
- Contractor type classification

### C.3 Time-Bound Access Windows

| Access Type | Maximum Duration | Extension Process |
|-------------|------------------|-------------------|
| Single Visit | 12 hours | Sponsor approval |
| Multi-Day Project | 30 days | EHS + Sponsor approval |
| Recurring (weekly) | 90 days | Quarterly re-certification |
| Carrier/Driver | 4 hours per visit | Dock supervisor approval |
| Inspector | Duration of audit | Sponsor escorts |

**Time Window Enforcement**:
- Access automatically expires at window end
- 30-minute warning before expiry (SMS/push)
- Extension request triggers sponsor notification
- Expired access = badge deactivated, check-out required

### C.4 Location & Area Scope

Areas are classified and access granted per contractor type:

| Area Classification | Examples | Access Requirements |
|---------------------|----------|---------------------|
| **PUBLIC** | Lobby, reception, restrooms | No badge required |
| **GENERAL** | Offices, conference rooms | Badge required |
| **SHIPPING** | Docks, staging areas | Badge + Driver/Contractor type |
| **PRODUCTION** | Shop floor, work centers | Badge + Orientation + PPE |
| **RESTRICTED** | Electrical rooms, mechanical | Badge + Permit + Qualification |
| **CRITICAL** | Main electrical, gas shutoffs | Badge + Permit + EHS approval |

### C.5 Badge / QR / RFID Integration

#### Badge Types

| Badge | Holder | Visual Indicator | Duration |
|-------|--------|------------------|----------|
| **VISITOR (Yellow)** | Non-working visitors | Large "V" | Single day |
| **CONTRACTOR (Orange)** | Working contractors | Contractor type code | Per project |
| **DRIVER (Blue)** | Carriers/drivers | "DRIVER" text | Single visit |
| **ESCORT REQUIRED (Red border)** | Any needing escort | Red border | Per visit |

#### Badge Features

- **QR Code**: Links to contractor profile for verification
- **Expiry Date/Time**: Printed on badge
- **Area Codes**: Authorized areas listed
- **Photo**: Contractor photo printed
- **RFID (optional)**: For electronic access control integration

### C.6 Access States

```
┌───────────────────────────────────────────────────────────────────┐
│                    CONTRACTOR ACCESS STATE MACHINE                 │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────┐                                                      │
│  │ INVITED  │◄─── Sponsor creates invitation                       │
│  └────┬─────┘                                                      │
│       │                                                            │
│       ▼ Contractor starts registration                             │
│  ┌────────────────────┐                                            │
│  │ PENDING_REQUIREMENTS│◄─── Requirements incomplete               │
│  └────────┬───────────┘                                            │
│           │                                                        │
│           ▼ All requirements met                                   │
│  ┌──────────┐                                                      │
│  │ APPROVED │◄─── Ready for check-in                               │
│  └────┬─────┘                                                      │
│       │                                                            │
│       ▼ Check-in at kiosk                                          │
│  ┌────────────┐                                                    │
│  │ CHECKED_IN │◄─── Badge issued, permit activated                 │
│  └─────┬──────┘                                                    │
│        │                                                           │
│        ▼ Work in progress                                          │
│  ┌───────────────┐                                                 │
│  │ ACTIVE_ONSITE │◄─── Working, permits active                     │
│  └───────┬───────┘                                                 │
│          │                                                         │
│          ├──── Work complete ────▶ ┌─────────────┐                 │
│          │                         │ CHECKED_OUT │                 │
│          │                         └─────────────┘                 │
│          │                                                         │
│          ├──── Time window expires ────▶ ┌─────────┐               │
│          │                               │ EXPIRED │               │
│          │                               └─────────┘               │
│          │                                                         │
│          └──── Violation / Stop-Work ────▶ ┌─────────┐             │
│                                            │ REVOKED │             │
│                                            └─────────┘             │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘
```

#### State Definitions

| State | Description | Allowed Actions |
|-------|-------------|-----------------|
| **INVITED** | Invitation sent, registration not started | Start registration |
| **PENDING_REQUIREMENTS** | Registration started, requirements incomplete | Complete requirements |
| **APPROVED** | All requirements met, awaiting arrival | Check-in |
| **CHECKED_IN** | On-site, badge issued | Begin work, request permits |
| **ACTIVE_ONSITE** | Actively working with valid permits | Work, check-out |
| **CHECKED_OUT** | Work complete, left premises | Re-enter (if window valid) |
| **EXPIRED** | Time window passed | Request extension |
| **REVOKED** | Access terminated for violation | Appeal to EHS |

---

## D) Pre-Access Requirements

### D.1 Requirement Matrix by Contractor Type

| Requirement | Maint | Elec | Rigging | Hot Work | IT | Driver | Inspector | Visitor |
|-------------|-------|------|---------|----------|----|---------|-----------|---------| 
| Company Info | ✓ | ✓ | ✓ | ✓ | ✓ | Via Carrier | ✓ | ○ |
| Insurance Cert | ✓ | ✓ | ✓ | ✓ | ✓ | Via Carrier | ○ | ○ |
| Safety Orientation | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (Short) | ✓ (Short) | ✓ (Short) |
| SDS Acknowledgment | ✓ | ✓ | ✓ | ✓ | ○ | ○ | ○ | ○ |
| Rules Acceptance | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| JHA Submission | ○ | ✓ | ✓ | ✓ | ○ | ○ | ○ | ○ |
| Permit Pre-Draft | ○ | ✓ | ✓ | ✓ | ○ | ○ | ○ | ○ |
| EHS Pre-Approval | ○ | ✓ | ✓ | ✓ | ○ | ○ | ○ | ○ |
| License Verification | ○ | ✓ | ✓ | ○ | ○ | CDL (auto) | ○ | ○ |
| Certifications | ○ | ✓ | ✓ | ✓ | ○ | ○ | ○ | ○ |

Legend: ✓ = Required | ○ = Not Required

### D.2 Requirement Details

#### Company Information

```yaml
company_registration:
  required_fields:
    - company_legal_name
    - dba_name (optional)
    - address
    - phone
    - emergency_contact
    - business_type
  verification:
    - SAM.gov check (federal contractors)
    - State business registration (optional)
```

#### Insurance Certificates

```yaml
insurance_requirements:
  general_liability:
    minimum: 1000000  # $1M per occurrence
    additional_insured: true  # Must name host company
    certificate_holder: "Company Name, Address"
  workers_compensation:
    required: true
    type: "Statutory"
  auto_liability:
    required_if: "contractor brings vehicles on-site"
    minimum: 1000000
  umbrella:
    required_if: "high_risk_work"
    minimum: 5000000
  expiry_monitoring:
    alert_days_before: 30
    block_access_if_expired: true
```

#### Safety Orientation

**Full Orientation (30 min)** - Maintenance, Electrical, Rigging, Hot Work Contractors

| Module | Duration | Content |
|--------|----------|---------|
| Facility Overview | 5 min | Layout, emergency exits, assembly points |
| Hazard Communication | 5 min | SDS access, chemical areas, labeling |
| PPE Requirements | 5 min | Required PPE by area |
| Emergency Procedures | 5 min | Fire, evacuation, medical emergency |
| Permit Requirements | 5 min | LOTO, hot work, confined space |
| Stop-Work Authority | 5 min | Right to stop, how to invoke |

**Short Orientation (10 min)** - IT, Drivers, Inspectors, Visitors

| Module | Duration | Content |
|--------|----------|---------|
| Facility Overview | 3 min | Allowed areas, restricted areas |
| Emergency Procedures | 3 min | Exits, assembly, dial 911 |
| Escort Requirements | 2 min | When escort required |
| Basic Safety Rules | 2 min | No photos, stay with escort |

#### Safety Rules Acceptance

```
CONTRACTOR SAFETY RULES ACKNOWLEDGMENT
══════════════════════════════════════

By checking each box below, I acknowledge and agree to:

□ I have completed the required safety orientation
□ I will wear required PPE at all times in designated areas
□ I will not perform work outside my authorized scope
□ I will stop work immediately if I observe an unsafe condition
□ I will report all incidents, near-misses, and hazards
□ I understand Stop-Work Authority applies to me
□ I will check out before leaving the facility
□ I understand violations may result in immediate removal

Signature: _________________ Date: _________
```

#### JHA Submission (High-Risk Work)

```yaml
jha_requirements:
  applies_to:
    - ELECTRICAL_CONTRACTOR
    - RIGGING_CRANE_CONTRACTOR
    - HOT_WORK_CONTRACTOR
  submission_deadline: "24 hours before work"
  required_content:
    - job_steps
    - hazards_per_step
    - controls_per_hazard
    - ppe_requirements
    - emergency_procedures
  review_by: EHS_MANAGER
  approval_required: true
  retention: 7_years
```

#### Permit Pre-Draft

Contractors must pre-draft permits for review:

| Permit Type | Pre-Draft Lead Time | Reviewer | Approver |
|-------------|---------------------|----------|----------|
| LOTO | 24 hours | Supervisor | EHS |
| Hot Work | 24 hours | Supervisor | EHS |
| Electrical Work | 24 hours | Supervisor | EHS |
| Critical Lift | 48 hours | EHS | Ops Manager |
| Confined Space | 48 hours | EHS | EHS Manager |

### D.3 Pre-Access Verification Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│              PRE-ACCESS VERIFICATION FLOW                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  SPONSOR                  CONTRACTOR                  EHS            │
│                                                                      │
│  Create Invitation ───────▶                                          │
│                            Receive Link ◀──────                      │
│                                 │                                    │
│                            Complete Registration                     │
│                                 │                                    │
│                            Upload Insurance                          │
│                                 │                                    │
│                            Complete Orientation                      │
│                                 │                                    │
│                            Accept Safety Rules                       │
│                                 │                                    │
│  ◀─────────────────── [If Standard Contractor] ──────────▶          │
│  Approve ─────────────▶                                              │
│                            STATUS: APPROVED ◀──────                  │
│                                                                      │
│  ◀─────────────────── [If High-Risk Contractor] ─────────▶          │
│                            Submit JHA ──────────────────▶            │
│                            Pre-Draft Permit ────────────▶            │
│                                                                      │
│                                                      Review JHA      │
│                                                      Review Permit   │
│                                                          │           │
│  ◀─────────────────────────────────────────────── Approve ──┘       │
│                            STATUS: APPROVED ◀──────                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## E) On-Site Check-In Workflow

### E.1 Check-In Modes

| Mode | Device | Use Case |
|------|--------|----------|
| **Kiosk Check-In** | Lobby kiosk with camera | Primary method |
| **Mobile Check-In** | Contractor's phone | Backup, GPS verified |
| **Receptionist Assisted** | Front desk | Technology fallback |
| **Emergency Fast-Track** | Supervisor override | Emergency contractors |

### E.2 Kiosk Check-In Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    KIOSK CHECK-IN WORKFLOW                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  STEP 1: IDENTIFICATION                                              │
│  ──────────────────────                                              │
│  ┌─────────────────────────────────────┐                             │
│  │  WELCOME                            │                             │
│  │                                     │                             │
│  │  [Scan QR Code from Invitation]     │                             │
│  │            - or -                   │                             │
│  │  [Enter Confirmation Code]          │                             │
│  │            - or -                   │                             │
│  │  [Search by Name/Company]           │                             │
│  │                                     │                             │
│  └─────────────────────────────────────┘                             │
│                                                                      │
│  STEP 2: IDENTITY VERIFICATION                                       │
│  ─────────────────────────────                                       │
│  ┌─────────────────────────────────────┐                             │
│  │  VERIFY YOUR IDENTITY               │                             │
│  │                                     │                             │
│  │  Name: John Smith                   │                             │
│  │  Company: ABC Electric              │                             │
│  │  Purpose: Electrical Maintenance    │                             │
│  │                                     │                             │
│  │  [Photo Capture] 📷                 │                             │
│  │                                     │                             │
│  │  [ Confirm This Is Me ]             │                             │
│  └─────────────────────────────────────┘                             │
│                                                                      │
│  STEP 3: REQUIREMENTS VERIFICATION                                   │
│  ─────────────────────────────────                                   │
│  ┌─────────────────────────────────────┐                             │
│  │  REQUIREMENTS CHECK                 │                             │
│  │                                     │                             │
│  │  ✅ Safety Orientation Complete     │                             │
│  │  ✅ Insurance Certificate Valid     │                             │
│  │  ✅ Safety Rules Accepted           │                             │
│  │  ✅ Electrical License Verified     │                             │
│  │  ✅ LOTO Permit Pre-Approved        │                             │
│  │                                     │                             │
│  │  [ Continue ]                       │                             │
│  └─────────────────────────────────────┘                             │
│                                                                      │
│  STEP 4: SITE RULES REMINDER                                         │
│  ───────────────────────────                                         │
│  ┌─────────────────────────────────────┐                             │
│  │  TODAY'S SITE RULES                 │                             │
│  │                                     │                             │
│  │  ⚠️ Hot work in Bay 3 - avoid area │                             │
│  │  ⚠️ Crane lift at 2pm - Zone B     │                             │
│  │  ℹ️ Fire drill scheduled for 3pm   │                             │
│  │                                     │                             │
│  │  YOUR PERMITTED AREAS:              │                             │
│  │  • Electrical Room A                │                             │
│  │  • Panel 7B (Saw Line)              │                             │
│  │                                     │                             │
│  │  [ I Understand ]                   │                             │
│  └─────────────────────────────────────┘                             │
│                                                                      │
│  STEP 5: PPE CONFIRMATION                                            │
│  ────────────────────────                                            │
│  ┌─────────────────────────────────────┐                             │
│  │  PPE REQUIREMENTS                   │                             │
│  │                                     │                             │
│  │  You MUST wear:                     │                             │
│  │  ☑ Safety Glasses                   │                             │
│  │  ☑ Steel-Toe Boots                  │                             │
│  │  ☑ High-Vis Vest                    │                             │
│  │  ☑ Arc Flash PPE (Cat 2 min)        │                             │
│  │                                     │                             │
│  │  [ I Confirm I Have This PPE ]      │                             │
│  └─────────────────────────────────────┘                             │
│                                                                      │
│  STEP 6: BADGE ISSUANCE                                              │
│  ──────────────────────                                              │
│  ┌─────────────────────────────────────┐                             │
│  │  CHECK-IN COMPLETE ✅               │                             │
│  │                                     │                             │
│  │  Your badge is printing...          │                             │
│  │                                     │                             │
│  │  Badge Number: C-2026-0847          │                             │
│  │  Valid Until: Today 5:00 PM         │                             │
│  │  Sponsor: Mike Johnson              │                             │
│  │                                     │                             │
│  │  ⚠️ Badge must be visible at all   │                             │
│  │     times                           │                             │
│  │                                     │                             │
│  │  🖨️ Collect badge from printer     │                             │
│  └─────────────────────────────────────┘                             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### E.3 Check-In Denial Scenarios

| Scenario | Kiosk Response | Notification |
|----------|----------------|--------------|
| **Requirements Incomplete** | "Requirements not met. Contact your sponsor." | SMS to sponsor |
| **Insurance Expired** | "Insurance certificate expired. Cannot proceed." | Email to sponsor + EHS |
| **Training Expired** | "Training certification expired. Complete before check-in." | SMS to contractor |
| **Time Window Not Started** | "Your access window starts at [time]. Please wait." | None |
| **Time Window Expired** | "Your access window has expired. Contact sponsor." | SMS to sponsor |
| **Access Revoked** | "Access has been revoked. Contact EHS." | Alert to EHS |
| **Already Checked In** | "You are already checked in. Badge: [number]" | None |

### E.4 Escort Assignment

For contractor types requiring escort:

```
┌─────────────────────────────────────────┐
│  ESCORT ASSIGNMENT                      │
│                                         │
│  You require an escort for today's visit│
│                                         │
│  Your Escort: Sarah Williams            │
│  Department: Quality                    │
│  Contact: ext. 2847                     │
│                                         │
│  ⏳ Waiting for escort to arrive...    │
│                                         │
│  [Notify Escort]                        │
└─────────────────────────────────────────┘
```

Escort receives notification:
- Push notification to mobile app
- SMS backup
- Slack/Teams message (if integrated)

**Escort must confirm arrival** before contractor proceeds.

### E.5 Check-Out Workflow

```
┌─────────────────────────────────────────┐
│  CHECK-OUT                              │
│                                         │
│  Name: John Smith                       │
│  Badge: C-2026-0847                     │
│  Check-In: 8:15 AM                      │
│  Duration: 6h 45m                       │
│                                         │
│  Work Status:                           │
│  ○ Complete                             │
│  ○ Returning Tomorrow                   │
│  ○ Not Complete - Issue                 │
│                                         │
│  Permits Closed: LOTO-2026-0147 ✅      │
│                                         │
│  [ Complete Check-Out ]                 │
└─────────────────────────────────────────┘
```

**Check-Out Enforcement**:
- Open permits must be closed or transferred before check-out
- Sponsor notified of check-out
- Badge deactivated immediately
- LOTO locks must be accounted for

---

## F) Permit & Work Authorization

### F.1 Contractor Permit Rules

| Rule | Description |
|------|-------------|
| **Self-Approval Prohibited** | Contractors CANNOT approve their own permits |
| **Supervisor Pre-Approval** | Internal supervisor must review permit request |
| **EHS Approval (High-Risk)** | EHS must approve LOTO, Hot Work, Critical Lift |
| **Time-Bound** | All permits have explicit start/end times |
| **Location-Bound** | Permits specify exact equipment/area |
| **Person-Bound** | Permits tied to specific contractor(s) |
| **Visible to Dispatch** | Active permits visible in dispatch system |
| **Stop-Work Trigger** | Invalid/expired permit triggers Stop-Work |

### F.2 Permit Request Flow (Contractor)

```
┌─────────────────────────────────────────────────────────────────────┐
│              CONTRACTOR PERMIT REQUEST FLOW                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  CONTRACTOR                    SUPERVISOR             EHS            │
│                                                                      │
│  Submit Permit Request ─────▶                                        │
│  (via portal/mobile)                                                │
│                                Review Request                        │
│                                    │                                 │
│                                ┌───┴───┐                             │
│                                │       │                             │
│                            Approve   Reject                          │
│                                │       │                             │
│                                │       └──▶ Notify contractor        │
│                                │                                     │
│                                ▼                                     │
│                         [If LOTO/Hot Work/Critical]                  │
│                                │                                     │
│                                ├─────────────────────▶ Review        │
│                                                          │           │
│                                                      ┌───┴───┐       │
│                                                      │       │       │
│                                                  Approve   Reject    │
│                                                      │       │       │
│  Permit Activated ◀──────────────────────────────────┘       │       │
│                                                              │       │
│  Permit Rejected ◀───────────────────────────────────────────┘       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### F.3 Permit Types for Contractors

#### LOTO Permit (Lockout/Tagout)

```yaml
loto_permit_contractor:
  request_fields:
    - equipment_id
    - work_description
    - energy_sources: [electrical, hydraulic, pneumatic, mechanical, thermal, stored]
    - isolation_points
    - verification_method
    - estimated_duration
    - contractor_names
    - emergency_contact
  approval_chain:
    - supervisor (asset owner)
    - ehs_manager
  execution:
    - contractor applies personal lock
    - supervisor verifies isolation
    - work proceeds
    - contractor removes lock
    - supervisor verifies restoration
  expiry: end_of_shift_or_specified_time
  extension: requires_new_approval
```

#### Hot Work Permit

```yaml
hot_work_permit_contractor:
  request_fields:
    - location
    - work_type: [welding, cutting, grinding, brazing]
    - fire_hazards_nearby
    - fire_watch_assigned
    - fire_extinguisher_location
    - sprinkler_status
    - combustibles_cleared: boolean
    - duration
  approval_chain:
    - supervisor
    - ehs_manager
  requirements:
    - fire_watch_during_work: true
    - fire_watch_after_work: 30_minutes
    - fire_extinguisher_within_25ft: true
  expiry: specified_end_time_or_8_hours_max
  post_work:
    - fire_watch_signs_off
    - area_inspection_30_min
```

#### Electrical Work Permit

```yaml
electrical_work_permit_contractor:
  request_fields:
    - panel_or_equipment_id
    - work_description
    - voltage_level
    - arc_flash_hazard_category
    - ppe_required
    - test_equipment
    - isolation_method
  approval_chain:
    - supervisor
    - ehs_manager
  requirements:
    - loto_required: true
    - arc_flash_ppe_worn: true
    - qualified_person_verification: true
  expiry: end_of_task_or_shift
```

#### Critical Lift Permit

```yaml
critical_lift_permit_contractor:
  criteria:
    - load_over_75_percent_capacity: true
    - personnel_in_swing_radius: true
    - multiple_cranes: true
    - load_over_sensitive_equipment: true
  request_fields:
    - crane_id
    - load_description
    - load_weight
    - lift_radius
    - lift_height
    - rigging_plan_attached
    - signal_person_assigned
    - area_barricaded
  approval_chain:
    - ops_manager
    - ehs_manager
    - rigging_qualified_person
  meeting_required:
    - pre_lift_meeting: true
    - all_parties_sign: true
```

### F.4 Permit Visibility in Dispatch

Active contractor permits are visible in:
- Dispatch Board (work center view)
- Asset Detail page
- Safety Dashboard

Display format:
```
┌──────────────────────────────────────┐
│ 🔴 ACTIVE PERMITS - Saw Line 2       │
├──────────────────────────────────────┤
│ LOTO-2026-0147                       │
│ Contractor: ABC Electric             │
│ Work: Panel replacement              │
│ Valid: 8:00 AM - 4:00 PM            │
│ Status: ⚡ LOCKED OUT                │
│                                      │
│ ⚠️ Do not energize                  │
└──────────────────────────────────────┘
```

---

## G) Integration with Dispatch & Stop-Work

### G.1 Dispatch Integration Rules

#### Pre-Dispatch Safety Checks

Before any job is dispatched to a work center, the system checks:

```javascript
function validateDispatch(job, workCenter) {
  const blocks = [];
  
  // 1. Check for contractor requirements
  if (job.requiresContractor) {
    const contractor = getAssignedContractor(job);
    
    if (!contractor) {
      blocks.push({
        type: 'CONTRACTOR_NOT_ASSIGNED',
        message: 'Job requires contractor but none assigned'
      });
    } else {
      // Verify contractor is checked in
      if (contractor.status !== 'ACTIVE_ONSITE') {
        blocks.push({
          type: 'CONTRACTOR_NOT_ONSITE',
          message: `Contractor ${contractor.name} not checked in`,
          contractor: contractor.id
        });
      }
      
      // Verify permits are active
      const requiredPermits = getRequiredPermits(job, workCenter);
      for (const permitType of requiredPermits) {
        const permit = getActivePermit(contractor, permitType, workCenter);
        if (!permit) {
          blocks.push({
            type: 'PERMIT_MISSING',
            message: `${permitType} permit required but not active`,
            permitType: permitType
          });
        } else if (isExpired(permit)) {
          blocks.push({
            type: 'PERMIT_EXPIRED',
            message: `${permitType} permit expired at ${permit.expiresAt}`,
            permitId: permit.id
          });
        }
      }
      
      // Verify training current
      const requiredTraining = getRequiredTraining(job.type);
      for (const training of requiredTraining) {
        if (!hasValidTraining(contractor, training)) {
          blocks.push({
            type: 'TRAINING_EXPIRED',
            message: `Contractor ${training} certification expired`,
            trainingType: training
          });
        }
      }
    }
  }
  
  // 2. Check for active contractor work on asset
  const activeContractorWork = getActiveContractorPermits(workCenter.assetId);
  if (activeContractorWork.length > 0) {
    for (const permit of activeContractorWork) {
      if (permit.type === 'LOTO') {
        blocks.push({
          type: 'ASSET_LOCKED_OUT',
          message: `Asset locked out by contractor: ${permit.contractorName}`,
          permitId: permit.id
        });
      }
    }
  }
  
  return {
    canDispatch: blocks.length === 0,
    blocks: blocks
  };
}
```

#### Dispatch Block Examples

| Scenario | Block Type | Dispatch Behavior |
|----------|------------|-------------------|
| Crane lift requires rigging contractor | CONTRACTOR_NOT_ASSIGNED | Job cannot be scheduled |
| Electrical contractor not checked in | CONTRACTOR_NOT_ONSITE | Job held until check-in |
| LOTO permit expired | PERMIT_EXPIRED | Job blocked, supervisor notified |
| Contractor welding cert expired | TRAINING_EXPIRED | Job blocked, contractor notified |
| Asset under LOTO by contractor | ASSET_LOCKED_OUT | No work on asset until released |

### G.2 Stop-Work Authority for Contractors

Contractors are **fully subject to Stop-Work Authority**:

#### SWA Trigger Events for Contractors

| Event | Auto-Trigger | Severity |
|-------|--------------|----------|
| Working without active permit | Yes | CRITICAL |
| Working outside authorized area | Yes | HIGH |
| Permit expired during work | Yes | HIGH |
| PPE violation observed | No (manual) | MEDIUM |
| Unauthorized equipment use | Yes | HIGH |
| Working past check-in window | Yes | MEDIUM |
| Escort-required working alone | Yes | HIGH |

#### SWA Flow for Contractor Violations

```
┌─────────────────────────────────────────────────────────────────────┐
│              STOP-WORK AUTHORITY - CONTRACTOR VIOLATION              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  VIOLATION DETECTED                                                  │
│  (Permit expired, scope violation, etc.)                             │
│         │                                                            │
│         ▼                                                            │
│  ┌─────────────────────────────────┐                                │
│  │ STOP-WORK AUTO-INITIATED        │                                │
│  │ SWA-2026-0152                   │                                │
│  │                                 │                                │
│  │ Scope: Contractor work area     │                                │
│  │ Reason: PERMIT_VIOLATION        │                                │
│  │ Contractor: ABC Electric        │                                │
│  └─────────────────────────────────┘                                │
│         │                                                            │
│         ▼                                                            │
│  IMMEDIATE NOTIFICATIONS:                                            │
│  • Contractor (via mobile) - STOP WORK IMMEDIATELY                   │
│  • Sponsor (via SMS/app)                                             │
│  • EHS Manager (via app/email)                                       │
│  • Supervisor (via app)                                              │
│         │                                                            │
│         ▼                                                            │
│  CONTRACTOR MUST:                                                    │
│  1. Stop all work immediately                                        │
│  2. Make area safe                                                   │
│  3. Report to sponsor/supervisor                                     │
│  4. Await clearance instructions                                     │
│         │                                                            │
│         ▼                                                            │
│  CLEARANCE PROCESS:                                                  │
│  1. Investigate violation                                            │
│  2. Correct root cause                                               │
│  3. Renew permit (if applicable)                                     │
│  4. EHS approval to resume                                           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

#### Contractor Actions in Safety Logs

All contractor actions are logged:

| Action | Log Entry |
|--------|-----------|
| Check-in | `CONTRACTOR_CHECK_IN: John Smith (ABC Electric) - Badge C-2026-0847` |
| Permit activation | `PERMIT_ACTIVATED: LOTO-2026-0147 by contractor C-0847` |
| Work area entry | `AREA_ENTRY: C-0847 entered Electrical Room A` |
| SWA event | `STOP_WORK_CONTRACTOR: C-0847 - PERMIT_EXPIRED` |
| Permit closure | `PERMIT_CLOSED: LOTO-2026-0147 by C-0847 - Work complete` |
| Check-out | `CONTRACTOR_CHECK_OUT: C-0847 - Duration 6h45m` |

### G.3 Real-Time Status Board

Operations can see contractor status on the Dispatch Board:

```
┌─────────────────────────────────────────────────────────────────────┐
│  CONTRACTOR STATUS - Today                                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  CHECKED IN (3)                                                      │
│  ├─ John Smith (ABC Electric) - Electrical Room A - LOTO active     │
│  ├─ Tom Brown (XYZ Maintenance) - HVAC Unit 3 - No permit           │
│  └─ Jane Doe (Rigging Co) - Bay 5 - Lift permit pending             │
│                                                                      │
│  EXPECTED TODAY (2)                                                  │
│  ├─ Mike Wilson (IT Services) - ETA 2:00 PM                         │
│  └─ Sara Johnson (Crane Operator) - ETA 3:00 PM                     │
│                                                                      │
│  ⚠️ ALERTS                                                          │
│  └─ Jane Doe lift permit approval pending > 30 min                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## H) UI/UX Design (Material UI)

### H.1 Portal Structure

```
CONTRACTOR & VISITOR SAFETY PORTAL
├── Public Pages (No Auth)
│   ├── Pre-Registration Form
│   ├── Safety Orientation (Video + Quiz)
│   ├── Document Upload
│   └── Check-In Status
│
├── Contractor Dashboard (Contractor Auth)
│   ├── My Profile
│   ├── Active Invitations
│   ├── Training & Certifications
│   ├── Permit Requests
│   └── Check-In / Check-Out
│
├── Sponsor Dashboard (Employee Auth)
│   ├── Invite Contractor
│   ├── My Invited Contractors
│   ├── Pending Approvals
│   └── Active Contractors
│
├── EHS Oversight Dashboard (EHS Auth)
│   ├── All Contractors (Real-Time)
│   ├── Pending High-Risk Approvals
│   ├── Active Permits
│   ├── Violations & SWA
│   └── Reports & Audit
│
└── Admin
    ├── Contractor Companies
    ├── Requirement Configuration
    └── Kiosk Management
```

### H.2 Page Designs

#### Pre-Registration Form

```jsx
<Container maxWidth="md">
  <Paper sx={{ p: 4, mt: 4 }}>
    <Typography variant="h4" gutterBottom>
      Contractor Pre-Registration
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
      Complete this form to register for site access
    </Typography>
    
    <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
      <Step><StepLabel>Personal Info</StepLabel></Step>
      <Step><StepLabel>Company Info</StepLabel></Step>
      <Step><StepLabel>Documentation</StepLabel></Step>
      <Step><StepLabel>Safety Orientation</StepLabel></Step>
      <Step><StepLabel>Acknowledgments</StepLabel></Step>
    </Stepper>
    
    {/* Step 1: Personal Info */}
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="First Name" required />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Last Name" required />
      </Grid>
      <Grid item xs={12}>
        <TextField fullWidth label="Email" type="email" required />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Phone" required />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Contractor Type</InputLabel>
          <Select label="Contractor Type">
            <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
            <MenuItem value="ELECTRICAL">Electrical</MenuItem>
            <MenuItem value="RIGGING">Rigging/Crane</MenuItem>
            <MenuItem value="HOT_WORK">Hot Work/Welding</MenuItem>
            <MenuItem value="IT">IT Vendor</MenuItem>
            <MenuItem value="CARRIER">Carrier/Driver</MenuItem>
            <MenuItem value="VISITOR">Visitor</MenuItem>
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  </Paper>
</Container>
```

#### Sponsor Dashboard - Invite Contractor

```jsx
<Box sx={{ p: 3 }}>
  <Typography variant="h5" gutterBottom>
    Invite Contractor
  </Typography>
  
  <Card sx={{ mb: 3 }}>
    <CardContent>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Autocomplete
            options={contractorCompanies}
            renderInput={(params) => 
              <TextField {...params} label="Company" />
            }
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Contact Email" />
        </Grid>
        <Grid item xs={12} md={6}>
          <DateTimePicker label="Access Start" />
        </Grid>
        <Grid item xs={12} md={6}>
          <DateTimePicker label="Access End" />
        </Grid>
        <Grid item xs={12}>
          <TextField 
            fullWidth 
            multiline 
            rows={2} 
            label="Purpose of Visit" 
          />
        </Grid>
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Areas Needed</InputLabel>
            <Select multiple label="Areas Needed">
              <MenuItem value="PRODUCTION">Production Floor</MenuItem>
              <MenuItem value="ELECTRICAL">Electrical Rooms</MenuItem>
              <MenuItem value="MECHANICAL">Mechanical Rooms</MenuItem>
              <MenuItem value="OFFICE">Office Areas</MenuItem>
              <MenuItem value="SHIPPING">Shipping/Receiving</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            control={<Checkbox />}
            label="High-risk work (requires EHS approval)"
          />
        </Grid>
      </Grid>
    </CardContent>
    <CardActions>
      <Button variant="contained" color="primary">
        Send Invitation
      </Button>
    </CardActions>
  </Card>
  
  {/* My Active Invitations */}
  <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
    My Invited Contractors
  </Typography>
  <TableContainer component={Paper}>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Contractor</TableCell>
          <TableCell>Company</TableCell>
          <TableCell>Access Window</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow>
          <TableCell>John Smith</TableCell>
          <TableCell>ABC Electric</TableCell>
          <TableCell>Today 8am - 5pm</TableCell>
          <TableCell>
            <Chip label="Checked In" color="success" size="small" />
          </TableCell>
          <TableCell>
            <IconButton size="small"><VisibilityIcon /></IconButton>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </TableContainer>
</Box>
```

#### EHS Oversight Dashboard

```jsx
<Box sx={{ p: 3 }}>
  <Typography variant="h4" gutterBottom>
    Contractor & Visitor Oversight
  </Typography>
  
  {/* Real-Time Stats */}
  <Grid container spacing={2} sx={{ mb: 3 }}>
    <Grid item xs={6} md={3}>
      <Card sx={{ bgcolor: 'success.light' }}>
        <CardContent>
          <Typography variant="overline">On-Site Now</Typography>
          <Typography variant="h3">7</Typography>
        </CardContent>
      </Card>
    </Grid>
    <Grid item xs={6} md={3}>
      <Card sx={{ bgcolor: 'warning.light' }}>
        <CardContent>
          <Typography variant="overline">Active Permits</Typography>
          <Typography variant="h3">4</Typography>
        </CardContent>
      </Card>
    </Grid>
    <Grid item xs={6} md={3}>
      <Card sx={{ bgcolor: 'info.light' }}>
        <CardContent>
          <Typography variant="overline">Pending Approvals</Typography>
          <Typography variant="h3">2</Typography>
        </CardContent>
      </Card>
    </Grid>
    <Grid item xs={6} md={3}>
      <Card sx={{ bgcolor: 'error.light' }}>
        <CardContent>
          <Typography variant="overline">Active SWA</Typography>
          <Typography variant="h3">0</Typography>
        </CardContent>
      </Card>
    </Grid>
  </Grid>
  
  {/* Pending High-Risk Approvals */}
  <Paper sx={{ p: 2, mb: 3 }}>
    <Typography variant="h6" gutterBottom>
      Pending High-Risk Approvals
    </Typography>
    <Alert severity="warning" sx={{ mb: 2 }}>
      2 contractor requests awaiting EHS approval
    </Alert>
    <List>
      <ListItem divider>
        <ListItemAvatar>
          <Avatar sx={{ bgcolor: 'warning.main' }}>
            <ElectricalIcon />
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary="Electrical Panel Replacement"
          secondary="ABC Electric • LOTO Required • Submitted 2h ago"
        />
        <ListItemSecondaryAction>
          <Button color="success" sx={{ mr: 1 }}>Approve</Button>
          <Button color="error">Reject</Button>
        </ListItemSecondaryAction>
      </ListItem>
      <ListItem>
        <ListItemAvatar>
          <Avatar sx={{ bgcolor: 'error.main' }}>
            <LocalFireDepartmentIcon />
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary="Structural Welding - Bay 3"
          secondary="XYZ Welding • Hot Work Permit • Submitted 45m ago"
        />
        <ListItemSecondaryAction>
          <Button color="success" sx={{ mr: 1 }}>Approve</Button>
          <Button color="error">Reject</Button>
        </ListItemSecondaryAction>
      </ListItem>
    </List>
  </Paper>
  
  {/* All Contractors Today */}
  <Paper sx={{ p: 2 }}>
    <Typography variant="h6" gutterBottom>
      All Contractors Today
    </Typography>
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Company</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Active Permits</TableCell>
            <TableCell>Location</TableCell>
            <TableCell>Sponsor</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>John Smith</TableCell>
            <TableCell>ABC Electric</TableCell>
            <TableCell><Chip label="Electrical" size="small" /></TableCell>
            <TableCell><Chip label="On-Site" color="success" size="small" /></TableCell>
            <TableCell>LOTO-0147</TableCell>
            <TableCell>Electrical Room A</TableCell>
            <TableCell>Mike Johnson</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  </Paper>
</Box>
```

#### Check-In Kiosk UI

```jsx
// Full-screen kiosk mode
<Box sx={{ 
  height: '100vh', 
  display: 'flex', 
  flexDirection: 'column',
  bgcolor: 'grey.100'
}}>
  {/* Header */}
  <AppBar position="static" color="primary">
    <Toolbar>
      <Typography variant="h5">
        Safety Check-In
      </Typography>
      <Box sx={{ flexGrow: 1 }} />
      <Typography variant="body2">
        {currentTime}
      </Typography>
    </Toolbar>
  </AppBar>
  
  {/* Main Content */}
  <Box sx={{ 
    flex: 1, 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    p: 4
  }}>
    <Paper sx={{ 
      p: 6, 
      maxWidth: 600, 
      width: '100%',
      textAlign: 'center'
    }}>
      <Typography variant="h4" gutterBottom>
        Welcome
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Scan your invitation QR code or enter your code below
      </Typography>
      
      {/* QR Scanner */}
      <Box sx={{ 
        height: 300, 
        bgcolor: 'black', 
        borderRadius: 2,
        mb: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <QrCodeScannerIcon sx={{ fontSize: 100, color: 'grey.500' }} />
      </Box>
      
      <Divider sx={{ my: 3 }}>or</Divider>
      
      <TextField
        fullWidth
        label="Enter Confirmation Code"
        variant="outlined"
        size="large"
        inputProps={{ style: { fontSize: 24, textAlign: 'center' } }}
      />
      
      <Button 
        variant="contained" 
        size="large" 
        fullWidth 
        sx={{ mt: 3, py: 2 }}
      >
        Continue
      </Button>
    </Paper>
  </Box>
  
  {/* Footer */}
  <Box sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.200' }}>
    <Typography variant="caption" color="text.secondary">
      Need help? Call ext. 100 or ask at reception
    </Typography>
  </Box>
</Box>
```

### H.3 Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Simple** | Max 3 actions per screen |
| **Mobile-Friendly** | Responsive, touch targets 44px+ |
| **Minimal Friction** | Pre-fill known data, smart defaults |
| **Clear Safety Messaging** | Red for critical, warnings prominent |
| **Accessible** | WCAG 2.1 AA, screen reader support |
| **Multi-Language** | i18n for Spanish (at minimum) |

### H.4 Color Semantics

| Color | Meaning | Usage |
|-------|---------|-------|
| 🟢 Green | Approved, Active, Safe | Checked in, permit active |
| 🟡 Yellow | Warning, Pending | Pending approval, expiring soon |
| 🔴 Red | Critical, Blocked, Denied | Check-in denied, SWA active |
| 🔵 Blue | Information, Action | Instructions, buttons |
| ⚫ Grey | Inactive, Disabled | Expired, unavailable |

---

## I) Audit & Evidence

### I.1 Records Retained

| Record Type | Data Captured | Retention |
|-------------|---------------|-----------|
| **Identity Records** | Name, company, photo, contact | 7 years |
| **Insurance Certificates** | PDF, expiry date, coverage | 7 years |
| **Orientation Completion** | Video watched, quiz score, timestamp | 7 years |
| **Acknowledgments** | Safety rules, SDS, policies - with signature | 7 years |
| **Check-In/Check-Out** | Timestamp, badge number, kiosk ID | 7 years |
| **Permits** | Full permit data, approvals, closures | 7 years |
| **Area Access** | Entry/exit timestamps per area | 3 years |
| **SWA Events** | Full SWA record if contractor involved | 7 years |
| **Violations** | Type, description, resolution | 7 years |

### I.2 Audit Log Schema

```prisma
model ContractorAuditLog {
  id              String    @id @default(uuid())
  contractorId    String
  action          String    // CHECK_IN, CHECK_OUT, PERMIT_REQUEST, AREA_ENTRY, VIOLATION, etc.
  description     String
  metadata        Json?     // Additional context
  performedBy     String?   // User who performed action (if not self)
  ipAddress       String?
  deviceId        String?   // Kiosk ID or mobile device
  locationId      String?
  createdAt       DateTime  @default(now())
  
  // Hash chain for immutability
  previousHash    String?
  hash            String
  
  @@index([contractorId, createdAt])
  @@index([action, createdAt])
  @@index([locationId, createdAt])
}
```

### I.3 Exportable Audit Packages

#### Standard Audit Package

```
/api/contractor/audit-package?startDate=2025-01-01&endDate=2025-12-31

Returns ZIP:
├── summary.pdf           # Executive summary
├── contractor_list.csv   # All contractors in period
├── check_ins.csv         # All check-in/out records
├── permits.csv           # All permits issued
├── violations.csv        # All violations
├── training_records.csv  # Orientation completions
├── insurance_certs/      # Insurance certificates
│   ├── abc_electric.pdf
│   └── xyz_maintenance.pdf
└── integrity_report.pdf  # Hash chain verification
```

#### Insurance Claim Package

```
/api/contractor/claim-package?contractorId=XXX&incidentDate=2025-06-15

Returns ZIP:
├── contractor_profile.pdf    # Full contractor record
├── check_in_record.pdf       # Check-in for incident day
├── active_permits.pdf        # Permits active at time
├── orientation_record.pdf    # Orientation completion proof
├── insurance_cert.pdf        # Insurance certificate
├── acknowledgments.pdf       # All signed acknowledgments
├── area_access_log.pdf       # Where contractor went
└── timeline.pdf              # Minute-by-minute log
```

### I.4 Evidence Integrity

All records include:
- **Timestamp**: When created/modified
- **Actor**: Who performed action
- **Device**: Kiosk ID / mobile device ID
- **Location**: GPS (if mobile) or kiosk location
- **Hash**: SHA-256 of record content
- **Previous Hash**: Hash chain for audit entries

---

## J) Failure Modes to Prevent

### J.1 Prevention Matrix

| Failure Mode | Prevention Mechanism |
|--------------|---------------------|
| **Unregistered contractor working** | Check-in required before badge; no badge = no access |
| **Expired permits** | Real-time permit monitoring; auto-SWA on expiry |
| **Badge sharing** | Photo on badge; photo verification at check-in |
| **Unsupervised hot work** | Fire watch assignment required in permit; check-in verification |
| **Off-hours access** | Time window enforcement; badge deactivated outside window |
| **Undocumented visitors** | All persons must check in; reception training |
| **Expired insurance** | Automatic block when certificate expires |
| **Untrained contractor** | Training verification at check-in; block if expired |
| **Scope creep** | Permit limits to specific area/equipment; SWA if violated |
| **Escort-required alone** | Escort must confirm at kiosk; no badge without escort |
| **Tailgating** | One badge per person; anti-passback (if RFID) |
| **Emergency bypass** | Fast-track process exists with audit trail |

### J.2 System Enforcements

```yaml
enforcements:
  check_in:
    block_if:
      - requirements_incomplete
      - insurance_expired
      - training_expired
      - time_window_not_started
      - time_window_expired
      - access_revoked
      - previous_violation_unresolved
    
  permit_activation:
    block_if:
      - contractor_not_checked_in
      - supervisor_not_approved
      - ehs_not_approved (high_risk)
      - equipment_under_other_loto
      - area_not_in_access_scope
    
  work_execution:
    stop_work_if:
      - permit_expired
      - working_outside_scope
      - escort_required_but_alone
      - time_window_expired
      - insurance_expired_during_work
    
  check_out:
    block_if:
      - open_permits_not_closed
      - loto_locks_not_removed
      - tools_not_accounted (if tracked)
```

---

## K) Testing Scenarios

### K.1 Test Case Suite

#### TC-001: Contractor Arrives Without Training

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Sponsor invites contractor | Invitation sent |
| 2 | Contractor completes registration WITHOUT orientation | Status: PENDING_REQUIREMENTS |
| 3 | Contractor arrives at kiosk | Scans QR code |
| 4 | Kiosk checks requirements | Training = INCOMPLETE |
| 5 | Kiosk denies check-in | Message: "Safety orientation required" |
| 6 | Sponsor receives notification | SMS: "Contractor denied - training incomplete" |
| 7 | Contractor completes orientation on phone | Status: APPROVED |
| 8 | Contractor re-scans at kiosk | Check-in successful |

#### TC-002: Permit Expires Mid-Job

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Contractor checks in with LOTO permit | Permit valid 8am-12pm |
| 2 | Work in progress | Status: ACTIVE_ONSITE |
| 3 | Time reaches 11:45am | 15-minute warning sent to contractor |
| 4 | Time reaches 12:00pm | Permit status: EXPIRED |
| 5 | System triggers SWA | SWA auto-created for expired permit |
| 6 | Contractor receives notification | "STOP WORK - Permit expired" |
| 7 | Supervisor notified | "Contractor permit expired - SWA active" |
| 8 | Contractor requests extension | Extension workflow initiated |
| 9 | Supervisor + EHS approve extension | New permit issued |
| 10 | SWA cleared | Work resumes |

#### TC-003: Contractor Attempts Work Outside Scope

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Contractor checked in for "Electrical Room A" | Badge shows: "Electrical Room A" |
| 2 | Contractor attempts to enter "Electrical Room B" | (If access control) Entry denied |
| 3 | Contractor requests permit for Room B equipment | System checks: "Room B not in access scope" |
| 4 | Permit request denied | Message: "Location not authorized" |
| 5 | Supervisor notified | "Contractor attempted out-of-scope work" |

#### TC-004: Visitor Enters Restricted Area

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Visitor checks in (non-working) | Badge: VISITOR (Yellow), Escort required |
| 2 | Escort confirms at kiosk | Visitor proceeds with escort |
| 3 | Visitor separates from escort | (If location tracking) Alert generated |
| 4 | Visitor enters production floor alone | (If access control) Entry denied |
| 5 | Security notified | "Visitor in restricted area without escort" |
| 6 | Visitor located and escorted | Incident logged |

#### TC-005: Emergency Contractor Fast-Track

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Pipe burst - emergency plumber called | Time: 2am Saturday |
| 2 | On-call supervisor initiates emergency invite | Fast-track mode enabled |
| 3 | Plumber arrives on-site | No pre-registration |
| 4 | Supervisor escorts to kiosk | Emergency check-in |
| 5 | Supervisor vouches for contractor | Digital signature captured |
| 6 | Abbreviated safety acknowledgment | Verbal + signature |
| 7 | Temporary badge issued | Valid 4 hours |
| 8 | Work completed | Plumber checks out |
| 9 | Audit trail complete | All steps documented with timestamps |
| 10 | Follow-up requirement | Full registration within 48 hours |

#### TC-006: Escort-Required Violation

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Inspector checks in | Escort required |
| 2 | Escort: Sarah Williams assigned | Both confirmed at kiosk |
| 3 | Sarah leaves inspector briefly | Inspector alone in production |
| 4 | 10 minutes pass without escort | Alert generated |
| 5 | Supervisor notified | "Escort-required visitor alone" |
| 6 | Sarah returns | Escort resumed |
| 7 | Incident logged | Audit entry created |

#### TC-007: Dispatch Blocked by Missing Permit

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Maintenance job requires electrician | Job scheduled for 10am |
| 2 | Electrician contractor assigned | Invitation sent |
| 3 | 10am: Electrician not checked in | Dispatch attempts to release job |
| 4 | Pre-dispatch check fails | Block: CONTRACTOR_NOT_ONSITE |
| 5 | Job held in queue | Status: BLOCKED_SAFETY |
| 6 | Supervisor notified | "Job blocked - electrician not on-site" |
| 7 | Electrician checks in at 10:15 | Status: ACTIVE_ONSITE |
| 8 | Electrician requests LOTO permit | Permit approved |
| 9 | Pre-dispatch check passes | Job released |

### K.2 Automated Test Coverage

| Test Category | Count | Pass Criteria |
|---------------|-------|---------------|
| Unit Tests (Requirements Logic) | 50+ | 100% pass |
| Integration Tests (Check-In Flow) | 20+ | 100% pass |
| Integration Tests (Permit Flow) | 15+ | 100% pass |
| E2E Tests (Happy Path) | 10 | 100% pass |
| E2E Tests (Failure Modes) | 15 | 100% pass |
| Load Tests (Kiosk) | 5 | < 3s response under load |
| Security Tests (Access Control) | 10 | 100% pass |

---

## L) Rollout & Go/No-Go Criteria

### L.1 Phased Rollout Plan

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ROLLOUT PHASES                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  PHASE 0: DEVELOPMENT & QA (4 weeks)                                 │
│  ──────────────────────────────────                                  │
│  - Build all components                                              │
│  - Internal testing                                                  │
│  - Security review                                                   │
│                                                                      │
│  PHASE 1: PILOT BRANCH (4 weeks)                                     │
│  ─────────────────────────────                                       │
│  - Select pilot branch (moderate contractor volume)                  │
│  - Install kiosk                                                     │
│  - Train reception, supervisors, EHS                                 │
│  - Run parallel with paper system                                    │
│  - Gather feedback                                                   │
│                                                                      │
│  PHASE 2: PILOT REFINEMENT (2 weeks)                                 │
│  ───────────────────────────────────                                 │
│  - Address pilot feedback                                            │
│  - Process improvements                                              │
│  - Update training materials                                         │
│                                                                      │
│  PHASE 3: REGIONAL ROLLOUT (4 weeks)                                 │
│  ────────────────────────────────                                    │
│  - Deploy to 3-5 additional branches                                 │
│  - Include high-volume branch                                        │
│  - Train all personnel                                               │
│                                                                      │
│  PHASE 4: FULL DEPLOYMENT (6 weeks)                                  │
│  ─────────────────────────────────                                   │
│  - All remaining branches                                            │
│  - Legacy system sunset                                              │
│  - Full audit capability                                             │
│                                                                      │
│  PHASE 5: OPTIMIZATION (Ongoing)                                     │
│  ────────────────────────────────                                    │
│  - Analytics review                                                  │
│  - Process improvements                                              │
│  - Feature enhancements                                              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### L.2 Contractor Onboarding Communication

#### 30 Days Before Go-Live (Pilot Branch)

```
TO: All recurring contractors for [Branch Name]
SUBJECT: New Contractor Safety Check-In System - Action Required

Dear Contractor Partner,

Starting [Date], [Company Name] is implementing a new Contractor & Visitor Safety Portal at our [Branch] location.

WHAT'S CHANGING:
• All contractors must pre-register online before arrival
• Check-in will occur at a digital kiosk
• Permits will be requested and tracked electronically
• All visits will require valid insurance certificates on file

ACTION REQUIRED:
1. Complete your company registration at [URL]
2. Upload current insurance certificates
3. Complete the online safety orientation (30 min)

This registration is REQUIRED by [Date] to maintain site access.

Questions? Contact [EHS Manager] at [email/phone]

Thank you for helping us maintain a safe workplace.
```

#### At Go-Live

- Signage at entrance: "All Contractors Must Check In at Kiosk"
- Receptionist briefed on new process
- EHS on-site first week for support
- Paper backup available for first 2 weeks

### L.3 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Check-in Compliance** | 100% | All contractors checked in before work |
| **Pre-Registration Completion** | 95% in 30 days | % of recurring contractors registered |
| **Average Check-in Time** | < 3 minutes | Time from scan to badge |
| **Permit Request to Approval** | < 4 hours | For high-risk work |
| **System Uptime** | 99.5% | Kiosk availability |
| **User Satisfaction** | > 4.0/5.0 | Contractor survey |
| **Sponsor Adoption** | 100% | All sponsors using system |
| **Audit Completeness** | 100% | All required records captured |

### L.4 Go/No-Go Criteria

#### Pilot Phase Exit Criteria

| Criterion | Threshold | Status |
|-----------|-----------|--------|
| All test cases pass | 100% | ☐ |
| Check-in kiosk stable | 99% uptime (1 week) | ☐ |
| No data loss incidents | 0 | ☐ |
| Training completed | 100% of staff | ☐ |
| Contractor complaints | < 5 per week | ☐ |
| SWA integration tested | 3 test events | ☐ |
| Dispatch integration tested | 5 test blocks | ☐ |
| Insurance verification working | 100% of uploads | ☐ |
| Audit export tested | 2 test exports | ☐ |
| Security review passed | No critical findings | ☐ |

#### Full Deployment Exit Criteria

| Criterion | Threshold | Status |
|-----------|-----------|--------|
| Pilot success metrics met | All green | ☐ |
| Regional rollout success | 95% compliance | ☐ |
| All branches staff trained | 100% | ☐ |
| Contractor adoption | 90% pre-registered | ☐ |
| Executive sign-off | COO approved | ☐ |
| Legal review | Approved | ☐ |
| Insurance carrier notification | Acknowledged | ☐ |

### L.5 Rollback Plan

If critical issues arise:

1. **Immediate**: Revert to paper sign-in (backup always available)
2. **Short-term**: Disable kiosk, use receptionist-assisted check-in
3. **Medium-term**: Identify and fix issues, re-pilot
4. **Communication**: Notify all contractors of temporary process

---

## Appendix A: Data Models

```prisma
// Contractor Portal Data Models

enum ContractorType {
  MAINTENANCE_CONTRACTOR
  ELECTRICAL_CONTRACTOR
  RIGGING_CRANE_CONTRACTOR
  HOT_WORK_CONTRACTOR
  IT_VENDOR
  CARRIER_DRIVER
  INSPECTOR_AUDITOR
  VISITOR_NONWORKING
}

enum ContractorAccessStatus {
  INVITED
  PENDING_REQUIREMENTS
  APPROVED
  CHECKED_IN
  ACTIVE_ONSITE
  CHECKED_OUT
  EXPIRED
  REVOKED
}

model ContractorCompany {
  id                  String    @id @default(uuid())
  name                String
  dbaName             String?
  address             String
  phone               String
  emergencyContact    String
  emergencyPhone      String
  businessType        String
  insuranceCertUrl    String?
  insuranceExpiry     DateTime?
  insuranceVerified   Boolean   @default(false)
  status              String    @default("ACTIVE")
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  
  contractors         Contractor[]
}

model Contractor {
  id                  String    @id @default(uuid())
  companyId           String
  firstName           String
  lastName            String
  email               String
  phone               String
  photoUrl            String?
  contractorType      ContractorType
  status              ContractorAccessStatus @default(INVITED)
  
  // Qualifications
  orientationComplete Boolean   @default(false)
  orientationDate     DateTime?
  rulesAccepted       Boolean   @default(false)
  rulesAcceptedAt     DateTime?
  sdsAcknowledged     Boolean   @default(false)
  
  // Certifications (JSON array)
  certifications      Json?
  
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  
  company             ContractorCompany @relation(fields: [companyId], references: [id])
  visits              ContractorVisit[]
  permits             ContractorPermit[]
  auditLogs           ContractorAuditLog[]
}

model ContractorVisit {
  id                  String    @id @default(uuid())
  contractorId        String
  sponsorId           String    // Internal employee who invited
  locationId          String
  
  // Access window
  scheduledStart      DateTime
  scheduledEnd        DateTime
  
  // Actual check-in/out
  checkInAt           DateTime?
  checkOutAt          DateTime?
  badgeNumber         String?
  kioskId             String?
  
  // Purpose
  purpose             String
  workDescription     String?
  areasAuthorized     String[]
  
  // Status
  status              ContractorAccessStatus
  escortRequired      Boolean   @default(false)
  escortId            String?
  
  // High-risk
  isHighRisk          Boolean   @default(false)
  jhaSubmitted        Boolean   @default(false)
  jhaApproved         Boolean   @default(false)
  ehsApprovedBy       String?
  ehsApprovedAt       DateTime?
  
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  
  contractor          Contractor @relation(fields: [contractorId], references: [id])
  permits             ContractorPermit[]
}

model ContractorPermit {
  id                  String    @id @default(uuid())
  contractorId        String
  visitId             String
  
  permitType          String    // LOTO, HOT_WORK, ELECTRICAL, CRITICAL_LIFT
  equipmentId         String?
  locationId          String
  areaId              String?
  
  // Permit details
  workDescription     String
  hazards             String[]
  controls            String[]
  ppeRequired         String[]
  
  // Approval chain
  supervisorApproved  Boolean   @default(false)
  supervisorId        String?
  supervisorApprovedAt DateTime?
  ehsApproved         Boolean   @default(false)
  ehsApprovedBy       String?
  ehsApprovedAt       DateTime?
  
  // Validity
  validFrom           DateTime
  validUntil          DateTime
  status              String    // DRAFT, PENDING, APPROVED, ACTIVE, EXPIRED, CLOSED, REVOKED
  
  // Closure
  closedAt            DateTime?
  closedBy            String?
  closureNotes        String?
  
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  
  contractor          Contractor @relation(fields: [contractorId], references: [id])
  visit               ContractorVisit @relation(fields: [visitId], references: [id])
}

model ContractorAuditLog {
  id                  String    @id @default(uuid())
  contractorId        String
  visitId             String?
  permitId            String?
  
  action              String
  description         String
  metadata            Json?
  
  performedBy         String?
  ipAddress           String?
  deviceId            String?
  locationId          String?
  
  previousHash        String?
  hash                String
  
  createdAt           DateTime  @default(now())
  
  contractor          Contractor @relation(fields: [contractorId], references: [id])
  
  @@index([contractorId, createdAt])
  @@index([action, createdAt])
}
```

---

## Appendix B: API Endpoints

```yaml
# Contractor Portal API

# Public (Pre-Registration)
POST   /api/contractors/register           # Start registration
GET    /api/contractors/invitation/:code   # Get invitation details
POST   /api/contractors/orientation/start  # Start orientation
POST   /api/contractors/orientation/complete # Complete orientation
POST   /api/contractors/documents/upload   # Upload insurance, certs
POST   /api/contractors/acknowledge        # Accept rules

# Contractor Auth
GET    /api/contractors/me                 # Get my profile
GET    /api/contractors/me/visits          # Get my visits
POST   /api/contractors/me/permits/request # Request permit
GET    /api/contractors/me/permits         # Get my permits

# Kiosk
POST   /api/kiosk/lookup                   # Lookup by QR/code
POST   /api/kiosk/check-in                 # Process check-in
POST   /api/kiosk/check-out                # Process check-out
GET    /api/kiosk/requirements/:id         # Get requirements status

# Sponsor (Employee)
POST   /api/sponsors/invite                # Invite contractor
GET    /api/sponsors/my-contractors        # Get my invited contractors
POST   /api/sponsors/approve/:visitId      # Approve visit
POST   /api/sponsors/permits/approve/:id   # Approve permit (supervisor)

# EHS
GET    /api/ehs/contractors                # All contractors today
GET    /api/ehs/pending-approvals          # Pending high-risk approvals
POST   /api/ehs/approve/:visitId           # EHS approve visit
POST   /api/ehs/permits/approve/:id        # EHS approve permit
GET    /api/ehs/violations                 # All violations
GET    /api/ehs/audit-package              # Generate audit package

# Dispatch Integration
GET    /api/dispatch/contractor-status     # Get contractor status for dispatch
POST   /api/dispatch/validate-contractor   # Validate contractor for job

# Admin
GET    /api/admin/contractor-companies     # All companies
POST   /api/admin/contractor-companies     # Add company
PUT    /api/admin/contractor-companies/:id # Update company
GET    /api/admin/kiosks                   # Manage kiosks
```

---

## Document Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| EHS Director | _________________ | _______ | _________ |
| VP Operations | _________________ | _______ | _________ |
| Risk Manager | _________________ | _______ | _________ |
| IT Director | _________________ | _______ | _________ |
| Legal Counsel | _________________ | _______ | _________ |

---

*This document defines the complete Contractor & Visitor Safety Portal specification. Implementation should follow the phased rollout plan with strict adherence to go/no-go criteria.*
