# 82-SAFETY-MODULE-AI-API.md
# Safety Module Specification - Part 3
## AI Safety Assistant, APIs, and Eventing/Audit

---

================================================================================
# G) AI SAFETY ASSISTANT (RAG + TOOLS + GUARDRAILS)
================================================================================

## G.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AI SAFETY ASSISTANT ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐                                                        │
│  │   User Query    │                                                        │
│  │   + Context     │                                                        │
│  └────────┬────────┘                                                        │
│           │                                                                 │
│           ▼                                                                 │
│  ┌─────────────────┐     ┌─────────────────────────────────────────────┐   │
│  │ Safety Guardrail│────►│ INPUT VALIDATION                            │   │
│  │   Pre-Check     │     │ - Block unsafe requests                     │   │
│  └────────┬────────┘     │ - Identify high-risk queries               │   │
│           │              │ - Route to human if uncertainty > threshold │   │
│           ▼              └─────────────────────────────────────────────┘   │
│  ┌─────────────────┐                                                        │
│  │   RAG Retrieval │◄────────────────────────────────────────────┐         │
│  │                 │                                              │         │
│  └────────┬────────┘     ┌────────────────────────────────────────┤         │
│           │              │                                        │         │
│           │    ┌─────────┴─────────┐   ┌─────────┴─────────┐     │         │
│           │    │  Safety KB        │   │  Company Policies │     │         │
│           │    │  (Standards)      │   │  (Internal Docs)  │     │         │
│           │    ├───────────────────┤   ├───────────────────┤     │         │
│           │    │ OSHA 1910.147     │   │ LOTO Procedures   │     │         │
│           │    │ OSHA 1910.178     │   │ Hot Work Policy   │     │         │
│           │    │ NFPA 70E          │   │ PPE Matrix        │     │         │
│           │    │ ANSI Z244.1       │   │ JHA Templates     │     │         │
│           │    │ ANSI B11 series   │   │ Training Manuals  │     │         │
│           │    │ ASME B30 series   │   │ SDS Summaries     │     │         │
│           │    └───────────────────┘   └───────────────────┘     │         │
│           │                                                       │         │
│           ▼                                                       │         │
│  ┌─────────────────┐     ┌─────────────────────────────────────────┤         │
│  │   LLM Engine    │     │  TOOL CALLS                             │         │
│  │   (Claude/GPT)  │────►│  - searchSafetyKB()                     │         │
│  │                 │     │  - createPermit()                       │         │
│  └────────┬────────┘     │  - createJHA()                          │         │
│           │              │  - logIncident()                        │         │
│           │              │  - scheduleInspection()                 │         │
│           │              │  - assignTraining()                     │         │
│           │              │  - fetchSDS()                           │         │
│           │              │  - blockWorkCenter()                    │         │
│           │              │  - notify()                             │         │
│           │              └─────────────────────────────────────────┘         │
│           ▼                                                                 │
│  ┌─────────────────┐                                                        │
│  │ Safety Guardrail│     ┌─────────────────────────────────────────────┐   │
│  │   Post-Check    │────►│ OUTPUT VALIDATION                           │   │
│  └────────┬────────┘     │ - Verify citations exist                    │   │
│           │              │ - Flag if action could increase risk        │   │
│           ▼              │ - Add disclaimers for high-risk advice      │   │
│  ┌─────────────────┐     │ - Require human confirmation for actions    │   │
│  │   Response +    │     └─────────────────────────────────────────────┘   │
│  │   Citations     │                                                        │
│  └─────────────────┘                                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## G.2 RAG Knowledge Base Corpus

### G.2.1 Regulatory Standards Library

| Standard | Content | Chunking Strategy | Update Frequency |
|----------|---------|-------------------|------------------|
| OSHA 29 CFR 1910.147 | Full text + interpretations | By paragraph with cross-refs | Annual review |
| OSHA 29 CFR 1910.178 | Full text + appendices | By section | Annual review |
| OSHA 29 CFR 1910.134 | Respiratory protection | By program element | Annual review |
| OSHA 29 CFR 1910.1200 | Hazard communication | By section | Annual review |
| NFPA 70E | Electrical safety | By article + tables | With each edition |
| ANSI/ASSP Z244.1 | Hazardous energy control | By section | With each edition |
| ANSI B11.0 | Machine safety | By clause | With each edition |
| ASME B30.2 | Overhead cranes | By chapter | With each edition |
| ASME B30.9 | Slings | By chapter | With each edition |
| ANSI Z359.1 | Fall protection | By section | With each edition |

### G.2.2 Internal Policy Library

| Document Type | Content | Metadata | Update Trigger |
|---------------|---------|----------|----------------|
| Safety Policies | All PolicyDocument entities | locationId, type, version | On publish |
| LOTO Procedures | Equipment-specific procedures | equipmentId, energySources | On approval |
| JHA Library | Approved JHAs | workCenterId, hazardTypes | On approval |
| PPE Matrix | PPERequirementMatrix | locationId, version | On approval |
| Training Manuals | Course content | courseId, category | On publish |
| Toolbox Talks | Meeting materials | topic, tags | On creation |
| Incident Learnings | Closed incident summaries | incidentType, rootCause | On incident close |

### G.2.3 SDS Integration

```typescript
interface SDSKnowledgeEntry {
  materialId: string;
  productName: string;
  manufacturer: string;
  
  // Extracted safety data (from SDS parsing)
  hazardSummary: string;
  emergencyOverview: string;
  firstAidMeasures: string[];
  firefightingMeasures: string[];
  accidentalReleaseMeasures: string[];
  handlingPrecautions: string[];
  exposureControls: string[];
  ppeRequired: string[];
  physicalProperties: Record<string, string>;
  stabilityReactivity: string;
  toxicologicalInfo: string;
  
  // Metadata
  gshClassification: string[];
  signalWord: string;
  lastUpdated: DateTime;
}
```

### G.2.4 Embedding & Indexing Strategy

```typescript
interface SafetyKBConfig {
  embeddingModel: 'text-embedding-3-large';
  vectorStore: 'pgvector'; // Supabase extension
  
  chunkingStrategy: {
    maxChunkSize: 1000;        // tokens
    overlapSize: 100;          // tokens
    preserveStructure: true;   // Keep headers, lists intact
    
    // Special handling for regulations
    regulatoryChunking: {
      preserveParagraphNumbers: true;
      includeCrossReferences: true;
      extractDefinitions: true;
    };
  };
  
  metadata: {
    required: ['source', 'documentType', 'version', 'effectiveDate'];
    optional: ['locationId', 'equipmentType', 'hazardType'];
  };
  
  indexing: {
    refreshSchedule: 'daily';
    triggerOnDocumentChange: true;
    batchSize: 100;
  };
}
```

## G.3 Tool Interfaces

### G.3.1 searchSafetyKB

```typescript
interface SearchSafetyKBTool {
  name: 'searchSafetyKB';
  description: 'Search the safety knowledge base for regulatory standards, policies, procedures, and guidance';
  
  parameters: {
    query: string;                        // Natural language query
    filters?: {
      documentTypes?: DocumentType[];     // REGULATION, POLICY, PROCEDURE, JHA, SDS
      hazardTypes?: HazardType[];         // LOTO, HOT_WORK, ELECTRICAL, etc.
      locationId?: string;                // Scope to location
      equipmentType?: EquipmentType;      // Scope to equipment type
    };
    maxResults?: number;                  // Default 5
    includeRegulations?: boolean;         // Include OSHA/NFPA/ANSI
    includeInternal?: boolean;            // Include company policies
  };
  
  returns: {
    results: Array<{
      content: string;
      source: string;                     // Document name/ID
      citation: string;                   // e.g., "OSHA 1910.147(c)(4)(i)"
      relevanceScore: number;
      documentType: DocumentType;
      metadata: Record<string, any>;
    }>;
    queryUnderstanding: string;           // How query was interpreted
  };
}

// Example usage
const results = await searchSafetyKB({
  query: "What are the requirements for lockout tagout verification?",
  filters: {
    documentTypes: ['REGULATION', 'POLICY'],
    hazardTypes: ['LOTO']
  },
  includeRegulations: true,
  includeInternal: true
});
```

### G.3.2 createPermit

```typescript
interface CreatePermitTool {
  name: 'createPermit';
  description: 'Create a draft permit for user review. Permit will be in DRAFT status until user submits.';
  
  parameters: {
    permitType: PermitType;               // LOTO, HOT_WORK, ELECTRICAL, CONFINED_SPACE
    locationId: string;
    workDescription: string;
    workLocationDescription: string;
    equipmentAssetIds?: string[];
    estimatedDuration: {
      value: number;
      unit: 'hours' | 'days';
    };
    requesterId: string;
    
    // Type-specific pre-fill
    lotoData?: Partial<LotoPermitData>;
    hotWorkData?: Partial<HotWorkPermitData>;
    electricalData?: Partial<ElectricalPermitData>;
    confinedSpaceData?: Partial<ConfinedSpacePermitData>;
    
    // JHA linkage
    existingJhaId?: string;
    generateJhaDraft?: boolean;
  };
  
  returns: {
    permitId: string;
    permitNumber: string;
    status: 'DRAFT';
    reviewUrl: string;                    // URL to review permit
    missingFields: string[];              // Fields that need user input
    warnings: string[];                   // Safety warnings/reminders
    suggestedApprovers: User[];
  };
  
  guardrails: {
    // Must verify user has permit.request permission
    // Must validate equipment exists and is not already locked out
    // Must check for conflicting permits
    // Always returns DRAFT, never auto-submits
  };
}
```

### G.3.3 createJHA

```typescript
interface CreateJHATool {
  name: 'createJHA';
  description: 'Generate a Job Hazard Analysis draft based on work context';
  
  parameters: {
    title: string;
    description: string;
    locationId: string;
    workCenterId?: string;
    equipmentAssetId?: string;
    taskSteps?: string[];                 // If provided, uses these as steps
    
    // Context for AI generation
    jobOrderId?: string;                  // Can pull material/process info
    materialTypes?: string[];             // e.g., ["steel", "aluminum"]
    processTypes?: string[];              // e.g., ["cutting", "welding"]
    toolsUsed?: string[];
  };
  
  returns: {
    jhaId: string;
    status: 'DRAFT';
    steps: Array<{
      sequenceNumber: number;
      taskDescription: string;
      hazards: Array<{
        description: string;
        hazardType: HazardType;
        severityBefore: number;
        probabilityBefore: number;
      }>;
      suggestedControls: Array<{
        description: string;
        controlType: ControlType;
        severityAfter: number;
        probabilityAfter: number;
      }>;
    }>;
    suggestedPPE: PPEItem[];
    requiredTraining: TrainingCourse[];
    reviewUrl: string;
    aiConfidence: number;                 // 0-1 confidence score
    reviewNotes: string;                  // AI notes for human reviewer
  };
  
  guardrails: {
    // Always generates as DRAFT
    // Flags low confidence items for human review
    // Includes standard hazards for equipment/material type
    // Never removes hazards, only adds
  };
}
```

### G.3.4 logIncident

```typescript
interface LogIncidentTool {
  name: 'logIncident';
  description: 'Create an incident report draft. Will be in DRAFT until user reviews and submits.';
  
  parameters: {
    type: IncidentType;
    locationId: string;
    occurredAt: DateTime;
    description: string;
    workCenterId?: string;
    affectedPersonType?: PersonType;
    equipmentAssetIds?: string[];
    immediateActions?: string;
    
    // For injury incidents
    injuryDetails?: Partial<InjuryDetails>;
  };
  
  returns: {
    incidentId: string;
    incidentNumber: string;
    status: 'DRAFT';
    reviewUrl: string;
    requiredFields: string[];             // Must complete before submit
    suggestedClassification: {
      severity: IncidentSeverity;
      oshaRecordable: boolean;
      rationale: string;
    };
    suggestedWitnesses: User[];           // Based on location/shift
    relatedIncidents: Incident[];         // Similar recent incidents
  };
  
  guardrails: {
    // NEVER auto-submits
    // Suggests but doesn't set OSHA classification
    // Prompts for all required fields
  };
}
```

### G.3.5 scheduleInspection

```typescript
interface ScheduleInspectionTool {
  name: 'scheduleInspection';
  description: 'Schedule an inspection for equipment or area';
  
  parameters: {
    inspectionType: InspectionType;
    templateId: string;
    locationId: string;
    scheduledDate: DateTime;
    equipmentAssetId?: string;
    workCenterId?: string;
    inspectorId?: string;                 // If not provided, suggests
    priority?: Priority;
    notes?: string;
  };
  
  returns: {
    inspectionId: string;
    status: 'SCHEDULED';
    assignedInspector: User;
    notificationsSent: string[];
    calendarEventCreated: boolean;
  };
  
  guardrails: {
    // Validates inspector is qualified
    // Checks for schedule conflicts
    // Respects inspection frequency rules
  };
}
```

### G.3.6 assignTraining

```typescript
interface AssignTrainingTool {
  name: 'assignTraining';
  description: 'Assign training course(s) to user(s)';
  
  parameters: {
    courseIds: string[];
    userIds: string[];
    dueDate: DateTime;
    priority?: Priority;
    reason?: TrainingTriggerType;
    reasonSourceId?: string;              // e.g., incidentId
    sendNotification?: boolean;
  };
  
  returns: {
    assignmentsCreated: Array<{
      assignmentId: string;
      userId: string;
      courseId: string;
      dueDate: DateTime;
    }>;
    skipped: Array<{
      userId: string;
      courseId: string;
      reason: string;                     // e.g., "Already completed, not expired"
    }>;
    notificationsSent: number;
  };
  
  guardrails: {
    // Checks prerequisites
    // Doesn't duplicate active assignments
    // Validates courses exist and are active
  };
}
```

### G.3.7 fetchSDS

```typescript
interface FetchSDSTool {
  name: 'fetchSDS';
  description: 'Retrieve Safety Data Sheet information for a material';
  
  parameters: {
    // One of the following:
    materialId?: string;
    productName?: string;
    casNumber?: string;
    
    // What information to return
    sections?: SDSSection[];              // If empty, returns summary
  };
  
  returns: {
    found: boolean;
    sdsRecord?: {
      productName: string;
      manufacturer: string;
      revisionDate: DateTime;
      
      // Summary
      hazardSummary: string;
      signalWord: string;
      pictograms: GHSPictogram[];
      
      // Requested sections
      sections: Record<SDSSection, string>;
      
      // Safety guidance
      ppeRequired: string[];
      handlingPrecautions: string[];
      firstAid: string[];
      
      pdfUrl: string;
    };
    alternatives?: SDSRecord[];           // If exact match not found
  };
}

enum SDSSection {
  IDENTIFICATION = 1,
  HAZARD_IDENTIFICATION = 2,
  COMPOSITION = 3,
  FIRST_AID = 4,
  FIREFIGHTING = 5,
  ACCIDENTAL_RELEASE = 6,
  HANDLING_STORAGE = 7,
  EXPOSURE_CONTROLS = 8,
  PHYSICAL_CHEMICAL = 9,
  STABILITY_REACTIVITY = 10,
  TOXICOLOGICAL = 11,
  ECOLOGICAL = 12,
  DISPOSAL = 13,
  TRANSPORT = 14,
  REGULATORY = 15,
  OTHER = 16
}
```

### G.3.8 blockWorkCenter

```typescript
interface BlockWorkCenterTool {
  name: 'blockWorkCenter';
  description: 'Block a work center from receiving dispatch due to safety issue. CRITICAL: Requires confirmation.';
  
  parameters: {
    workCenterId: string;
    reason: string;
    blockType: 'SAFETY_HOLD' | 'STOP_WORK' | 'EQUIPMENT_ISSUE';
    relatedRecordType?: 'INCIDENT' | 'STOP_WORK_EVENT' | 'INSPECTION_DEFECT';
    relatedRecordId?: string;
    estimatedDuration?: {
      value: number;
      unit: 'hours' | 'days';
    };
  };
  
  returns: {
    blocked: boolean;
    workCenterId: string;
    blockReason: string;
    blockedAt: DateTime;
    blockedById: string;
    affectedJobs: JobOrder[];             // Jobs that were scheduled
    notificationsSent: string[];
  };
  
  guardrails: {
    // REQUIRES human confirmation before execution
    // Logs as critical audit event
    // Notifies Ops Manager, Branch Manager immediately
    // Cannot be undone by AI - requires human authorization
  };
}
```

### G.3.9 notify

```typescript
interface NotifyTool {
  name: 'notify';
  description: 'Send notification to users or roles';
  
  parameters: {
    recipients: {
      userIds?: string[];
      roles?: UserRole[];
      locationIds?: string[];             // Combined with roles
    };
    channel: 'EMAIL' | 'SMS' | 'PUSH' | 'ALL';
    priority: 'NORMAL' | 'HIGH' | 'CRITICAL';
    subject: string;
    message: string;
    relatedRecordType?: ResourceType;
    relatedRecordId?: string;
    actionRequired?: boolean;
    actionUrl?: string;
  };
  
  returns: {
    notificationId: string;
    recipientCount: number;
    channelsUsed: string[];
    delivered: number;
    failed: number;
  };
  
  guardrails: {
    // Rate limiting per user
    // CRITICAL notifications require safety context
    // Message content reviewed for safety
  };
}
```

## G.4 Guardrails Implementation

### G.4.1 Input Guardrails

```typescript
interface InputGuardrails {
  // Blocked queries
  blockedPatterns: [
    /how to (bypass|disable|circumvent) safety/i,
    /skip (lockout|inspection|training)/i,
    /override safety (interlock|guard|system)/i,
    /work without (permit|authorization|ppe)/i,
    /hide (incident|injury|defect)/i
  ];
  
  // High-risk queries requiring extra caution
  highRiskPatterns: [
    /energized (electrical|work)/i,
    /confined space entry/i,
    /work at height/i,
    /hot work near (flammable|combustible)/i,
    /remove (guard|interlock)/i
  ];
  
  // Queries that must route to human
  humanRequiredPatterns: [
    /fatality|death/i,
    /amputation|hospitalization/i,
    /regulatory (visit|inspection|citation)/i,
    /legal|lawsuit|liability/i
  ];
  
  async validateInput(query: string, context: QueryContext): Promise<ValidationResult> {
    // Check blocked patterns
    for (const pattern of this.blockedPatterns) {
      if (pattern.test(query)) {
        return {
          allowed: false,
          reason: 'UNSAFE_REQUEST',
          response: 'I cannot provide guidance on bypassing safety controls. ' +
                   'Safety systems are in place to protect you and your coworkers. ' +
                   'Please contact your EHS representative for assistance.'
        };
      }
    }
    
    // Check high-risk patterns
    for (const pattern of this.highRiskPatterns) {
      if (pattern.test(query)) {
        return {
          allowed: true,
          flags: ['HIGH_RISK'],
          disclaimer: 'This involves high-risk work. Always consult your site EHS ' +
                     'representative and ensure proper permits are in place before proceeding.'
        };
      }
    }
    
    // Check human-required patterns
    for (const pattern of this.humanRequiredPatterns) {
      if (pattern.test(query)) {
        return {
          allowed: false,
          reason: 'REQUIRES_HUMAN',
          response: 'This matter requires direct consultation with your EHS team. ' +
                   'Please contact [EHS Contact] immediately.'
        };
      }
    }
    
    return { allowed: true };
  }
}
```

### G.4.2 Output Guardrails

```typescript
interface OutputGuardrails {
  async validateOutput(response: AIResponse, context: QueryContext): Promise<ValidatedResponse> {
    const validation: ValidationIssue[] = [];
    
    // 1. Verify all citations exist
    for (const citation of response.citations) {
      const exists = await this.verifyCitation(citation);
      if (!exists) {
        validation.push({
          type: 'INVALID_CITATION',
          citation: citation,
          action: 'REMOVE_OR_FLAG'
        });
      }
    }
    
    // 2. Check for potentially dangerous advice
    const dangerousAdvice = this.detectDangerousAdvice(response.content);
    if (dangerousAdvice.length > 0) {
      validation.push({
        type: 'POTENTIALLY_DANGEROUS',
        items: dangerousAdvice,
        action: 'ADD_WARNING'
      });
    }
    
    // 3. Ensure appropriate disclaimers
    if (context.isHighRisk && !response.hasDisclaimer) {
      validation.push({
        type: 'MISSING_DISCLAIMER',
        action: 'ADD_DISCLAIMER'
      });
    }
    
    // 4. Check for tool actions requiring confirmation
    for (const toolCall of response.toolCalls) {
      if (this.requiresConfirmation(toolCall)) {
        validation.push({
          type: 'REQUIRES_CONFIRMATION',
          toolCall: toolCall,
          action: 'PAUSE_FOR_CONFIRMATION'
        });
      }
    }
    
    // 5. Add confidence indicator
    if (response.confidence < 0.7) {
      validation.push({
        type: 'LOW_CONFIDENCE',
        confidence: response.confidence,
        action: 'ADD_UNCERTAINTY_NOTICE'
      });
    }
    
    return this.applyValidation(response, validation);
  }
  
  requiresConfirmation(toolCall: ToolCall): boolean {
    const confirmationRequired = [
      'blockWorkCenter',
      'createPermit',      // For high-risk permit types
      'logIncident'        // For severe incidents
    ];
    return confirmationRequired.includes(toolCall.name);
  }
  
  detectDangerousAdvice(content: string): string[] {
    const dangerous = [];
    
    // Check for advice that could lead to injury
    const dangerousPatterns = [
      { pattern: /you can skip/i, issue: 'Suggesting skipping safety steps' },
      { pattern: /not always necessary/i, issue: 'Minimizing safety requirements' },
      { pattern: /probably fine/i, issue: 'Uncertain safety advice' }
    ];
    
    for (const { pattern, issue } of dangerousPatterns) {
      if (pattern.test(content)) {
        dangerous.push(issue);
      }
    }
    
    return dangerous;
  }
}
```

### G.4.3 Safety-First Response Templates

```typescript
const safetyResponseTemplates = {
  uncertainSituation: `
    Based on the information provided, I'm not certain about the safest approach.
    
    **Recommended Action:**
    1. Stop work until the situation is clarified
    2. Contact your supervisor or EHS representative
    3. Do not proceed until you receive clear guidance
    
    Your safety is the priority. When in doubt, stop and ask.
  `,
  
  highRiskDisclaimer: `
    ⚠️ **IMPORTANT SAFETY NOTICE**
    
    This involves high-risk work that requires:
    - Active permit from authorized personnel
    - Completed Job Hazard Analysis (JHA)
    - Proper PPE as specified
    - Supervisor notification
    
    The guidance below is general information only. Always follow your site-specific 
    procedures and consult with EHS before proceeding.
  `,
  
  stopWorkReminder: `
    💡 **Remember: You have Stop Work Authority**
    
    If at any point you feel the work is unsafe, you have the right and 
    responsibility to stop work. No job is so important that it cannot be 
    done safely. Exercise your Stop Work Authority without fear of retaliation.
  `,
  
  referToEHS: `
    This situation requires direct involvement from your EHS team.
    
    **Please contact:**
    - Your site EHS representative
    - EHS hotline: [configured number]
    - For emergencies: 911
    
    Do not proceed without proper guidance.
  `
};
```

## G.5 Example Prompts & Responses

### G.5.1 JHA Generation

**User Prompt:**
> "I need to create a JHA for changing the blade on Band Saw #4. The saw is in work center WC-SAW-01."

**Assistant Response:**
```markdown
I'll help you create a Job Hazard Analysis for the band saw blade change. Let me generate a draft based on the equipment specifications and standard hazards.

---

## Job Hazard Analysis Draft

**Title:** Band Saw Blade Replacement - BS-004  
**Equipment:** Band Saw #4 (BS-004)  
**Work Center:** WC-SAW-01  
**Status:** DRAFT - Requires Review

### Step 1: Prepare for Blade Change
| Hazard | Type | Risk Before | Control | Risk After |
|--------|------|-------------|---------|------------|
| Unexpected startup | Energy Release | High (15) | LOTO per procedure LOTO-BS-004 | Low (2) |
| Residual blade tension | Mechanical | Medium (9) | Release tension before removing blade | Low (3) |

### Step 2: Remove Old Blade
| Hazard | Type | Risk Before | Control | Risk After |
|--------|------|-------------|---------|------------|
| Sharp blade edges | Cut/Laceration | High (12) | Cut-resistant gloves (ANSI A4), handle blade carefully | Low (4) |
| Pinch points | Caught-in | Medium (8) | Keep hands clear of wheel housing | Low (2) |
| Heavy blade (if large) | Ergonomic | Medium (6) | Two-person lift for blades >20 lbs | Low (2) |

### Step 3: Install New Blade
| Hazard | Type | Risk Before | Control | Risk After |
|--------|------|-------------|---------|------------|
| Sharp blade edges | Cut/Laceration | High (12) | Cut-resistant gloves, careful handling | Low (4) |
| Improper blade tracking | Equipment Damage | Medium (6) | Follow OEM procedure, verify tracking before full tension | Low (2) |

### Step 4: Test and Verify
| Hazard | Type | Risk Before | Control | Risk After |
|--------|------|-------------|---------|------------|
| Blade breakage | Struck-by | Medium (9) | Stand clear during initial startup, verify tension and tracking | Low (3) |

### Required PPE
- ✓ Safety glasses
- ✓ Cut-resistant gloves (ANSI A4 minimum)
- ✓ Steel-toed boots
- ✓ Long sleeves

### Required Training
- LOTO Authorized Employee (TRN-LOTO-001)
- Band Saw Operation (TRN-SAW-001)

### Permit Required
✓ **LOTO Permit Required** - This task requires lockout/tagout per procedure LOTO-BS-004

---

**⚠️ This is a draft JHA.** Please review all hazards and controls, add any site-specific considerations, and obtain required approvals before use.

[📝 Edit JHA Draft](link) | [📋 Create LOTO Permit](link)

*Reference: LOTO procedure LOTO-BS-004, OSHA 1910.147*
```

### G.5.2 Permit Draft Generation

**User Prompt:**
> "I need to do hot work welding on a steel frame in Bay 3. It's about 20 feet from the packaging area."

**Assistant Response:**
```markdown
⚠️ **IMPORTANT SAFETY NOTICE**

Hot work near the packaging area requires careful hazard assessment due to potential combustible materials.

I'll create a Hot Work Permit draft for your review. **This permit will require approval from your supervisor and EHS before work can begin.**

---

## Hot Work Permit Draft

**Permit Number:** HW-2026-XXXX (assigned on submit)  
**Status:** DRAFT  
**Location:** Bay 3 - Steel Frame Area  
**Proximity Alert:** 20 feet from Packaging Area ⚠️

### Work Description
Structural welding on steel frame

### Pre-Work Checklist (YOU MUST COMPLETE)
- [ ] Fire extinguisher present (minimum 20 lb ABC) within 25 feet
- [ ] Combustibles removed or covered within 35-foot radius
- [ ] Packaging materials in adjacent area protected/covered
- [ ] Floor swept, debris removed
- [ ] Sprinkler system active (or impairment permit obtained)
- [ ] Fire detection/alarm notified
- [ ] Openings in floors/walls covered

### Fire Watch Requirements
- **Fire Watch Required:** Yes
- **Fire Watch Duration:** During work + 60 minutes post-work
- **Fire Watch Person:** (assign trained person)
- Fire watch must have communication device
- Fire watch must know location of nearest fire pull station

### Proximity Hazards
| Hazard | Distance | Control |
|--------|----------|---------|
| Packaging Area | 20 feet | Cover/remove combustible packaging materials, maintain fire watch line-of-sight |
| Cardboard storage | ? | Verify distance, relocate if within 35 feet |

### PPE Required
- Welding helmet with appropriate shade lens
- Welding gloves
- Flame-resistant clothing
- Safety glasses (under helmet)
- Steel-toed boots

### Maximum Duration
8 hours from approval (permit expires automatically)

---

**🔥 Fire Watch Reminder:** Fire watch must be maintained for the full post-work monitoring period. Fire watch person must be trained and remain in the area continuously.

**Next Steps:**
1. Complete the pre-work checklist
2. Assign a trained fire watch person
3. Submit permit for approval
4. Wait for supervisor and EHS approval before starting work

[📝 Complete & Submit Permit](link) | [📋 View Fire Watch Training](link)

*Reference: Company Hot Work Policy HW-001, OSHA 1910.252*
```

### G.5.3 Incident Investigation Assistance

**User Prompt:**
> "We had a near-miss yesterday where a forklift almost struck a pedestrian in the shipping dock. Can you help me investigate this?"

**Assistant Response:**
```markdown
I'll help you structure the investigation for this near-miss. Near-miss investigations are valuable opportunities to prevent actual injuries.

---

## Near-Miss Investigation Guide

**Incident Type:** Near-Miss - Pedestrian/Forklift  
**Location:** Shipping Dock  
**Date:** [Yesterday's date]

### Immediate Information to Gather

**People to Interview:**
1. Forklift operator
2. Pedestrian involved
3. Any witnesses in the shipping dock area
4. Dock supervisor on shift

**Evidence to Collect:**
- [ ] Forklift operator's training records (verify current certification)
- [ ] Pre-shift inspection for that forklift (was it completed?)
- [ ] Shift assignment/dispatch records
- [ ] Traffic pattern documentation for the dock
- [ ] Any camera footage of the area
- [ ] Photos of the location (sightlines, signage, markings)

---

### 5 Whys Analysis Template

Start with: "A forklift almost struck a pedestrian in the shipping dock"

| Why | Answer | Evidence |
|-----|--------|----------|
| Why #1: Why did the near-contact occur? | (e.g., Forklift rounded corner without visibility) | |
| Why #2: Why was there no visibility? | (e.g., Stacked materials blocked sightline) | |
| Why #3: Why were materials stacked there? | (e.g., Overflow from receiving, no designated space) | |
| Why #4: Why was there overflow? | (e.g., High inbound volume, delayed put-away) | |
| Why #5: Root cause? | (e.g., Inadequate staging area planning + missing traffic controls) | |

---

### Common Contributing Factors for Forklift/Pedestrian Near-Misses

Consider whether any of these apply:

**Traffic Management:**
- [ ] Missing or faded floor markings
- [ ] No designated pedestrian walkways
- [ ] Blind corners without mirrors/warnings
- [ ] Mixed traffic patterns

**Operator Factors:**
- [ ] Speed for conditions
- [ ] Horn/warning use
- [ ] Looking in direction of travel
- [ ] Training adequacy

**Pedestrian Factors:**
- [ ] Pedestrian awareness training
- [ ] Use of designated walkways
- [ ] Distraction (phone, headphones)
- [ ] Right-of-way understanding

**Environmental:**
- [ ] Lighting adequacy
- [ ] Noise levels affecting awareness
- [ ] Congestion/clutter
- [ ] Time pressure

---

### Suggested Corrective Action Categories

Based on similar incidents, consider controls in this hierarchy:

1. **Engineering Controls** (most effective)
   - Physical barriers separating pedestrians and forklifts
   - Convex mirrors at blind corners
   - Blue/red forklift warning lights
   - Pedestrian detection systems

2. **Administrative Controls**
   - Designated pedestrian-only times
   - Traffic flow patterns
   - Enhanced floor markings
   - Mandatory horn at intersections

3. **PPE/Awareness**
   - High-visibility vests in forklift areas
   - Refresher training (both operators and pedestrians)

---

Would you like me to:
- [📋 Create draft incident report with this information](link)
- [🔍 Search for similar past incidents at your location](link)
- [📚 Pull pedestrian safety training materials](link)

*Reference: OSHA 1910.178(n), Company Forklift Safety Policy FL-001*
```

### G.5.4 PPE Guidance

**User Prompt:**
> "What PPE do I need for grinding aluminum?"

**Assistant Response:**
```markdown
## PPE Requirements for Aluminum Grinding

Based on our PPE Matrix and OSHA guidance, here are the requirements:

### Required PPE

| Category | Requirement | Specification | Reason |
|----------|-------------|---------------|--------|
| **Eye/Face** | Safety glasses + Face shield | ANSI Z87.1+ | Spark/particle protection |
| **Respiratory** | N95 or higher | NIOSH approved | Aluminum dust inhalation |
| **Hearing** | Earplugs or muffs | NRR 25+ | Noise levels typically >85 dBA |
| **Hand** | Leather gloves | Abrasion-resistant | Vibration, heat, abrasion |
| **Body** | Long sleeves, non-synthetic | Cotton or FR | Spark protection |
| **Foot** | Steel-toed boots | ASTM F2413 | Impact protection |

### Special Considerations for Aluminum

⚠️ **Fire Hazard:** Aluminum dust is combustible. Ensure:
- Dust collection is functioning
- No ignition sources near dust accumulation
- Housekeeping to prevent dust buildup

⚠️ **Cross-Contamination:** If grinding both steel and aluminum:
- Use dedicated grinding wheels for aluminum
- Ferrous contamination can cause issues with welds
- Clean grinding area between material changes

### Respiratory Protection Note

- If work area has adequate local exhaust ventilation (LEV), N95 may be sufficient
- Verify with your EHS representative that engineering controls are adequate
- If exposure exceeds PEL (15 mg/m³ total dust, 5 mg/m³ respirable), additional controls required

### Pre-Task Checklist

- [ ] LEV/dust collection verified working
- [ ] All PPE inspected and in good condition
- [ ] Face shield clean and unscratched
- [ ] Grinding wheel appropriate for aluminum (not steel wheel)
- [ ] Area clear of combustibles

---

[📋 View Full PPE Matrix](link) | [📚 Aluminum Grinding JHA](link)

*Reference: PPE Matrix v2.3, OSHA 1910.133, 1910.134, Company Grinding Policy*
```

---

================================================================================
# H) APIs (ENDPOINT LIST)
================================================================================

## H.1 Safety Incidents API

### Endpoints

| Method | Endpoint | Description | RBAC | Audit Event |
|--------|----------|-------------|------|-------------|
| GET | /api/safety/incidents | List incidents with filters | incident.view_* | - |
| GET | /api/safety/incidents/:id | Get incident details | incident.view_* | VIEW |
| POST | /api/safety/incidents | Create incident (draft) | incident.create | CREATE |
| PUT | /api/safety/incidents/:id | Update incident | incident.update | UPDATE |
| POST | /api/safety/incidents/:id/submit | Submit for review | incident.create | SUBMIT |
| POST | /api/safety/incidents/:id/triage | Triage incident | incident.triage | UPDATE |
| POST | /api/safety/incidents/:id/assign-investigator | Assign investigator | incident.assign_investigator | ASSIGN |
| POST | /api/safety/incidents/:id/investigation | Create/update investigation | incident.investigate | UPDATE |
| POST | /api/safety/incidents/:id/close | Close incident | incident.close | CLOSE |
| POST | /api/safety/incidents/:id/reopen | Reopen incident | incident.reopen | REOPEN |
| GET | /api/safety/incidents/:id/timeline | Get incident timeline | incident.view_* | - |
| POST | /api/safety/incidents/:id/attachments | Upload attachment | incident.update | UPDATE |
| GET | /api/safety/incidents/osha-log | OSHA 300 log data | incident.osha_classify | VIEW |

### Validations

```typescript
const incidentValidations = {
  create: {
    required: ['type', 'locationId', 'occurredAt', 'description'],
    validateOccurredAt: (date) => date <= now && date >= now - 30.days,
    validateLocation: async (locationId, user) => userHasAccessToLocation(user, locationId)
  },
  submit: {
    required: ['type', 'locationId', 'occurredAt', 'description', 'immediateActions', 'affectedPersonType'],
    validateSupervisorNotified: true
  },
  close: {
    required: ['closureNotes'],
    validateAllCapasClosed: true,
    validateInvestigationComplete: (incident) => !incident.investigationRequired || incident.investigation?.status === 'COMPLETE'
  }
};
```

## H.2 Safety CAPAs API

### Endpoints

| Method | Endpoint | Description | RBAC | Audit Event |
|--------|----------|-------------|------|-------------|
| GET | /api/safety/capas | List CAPAs | capa.view | - |
| GET | /api/safety/capas/:id | Get CAPA details | capa.view | VIEW |
| POST | /api/safety/capas | Create CAPA | capa.create | CREATE |
| PUT | /api/safety/capas/:id | Update CAPA | capa.update | UPDATE |
| POST | /api/safety/capas/:id/assign | Assign CAPA | capa.assign | ASSIGN |
| POST | /api/safety/capas/:id/implement | Mark implemented | capa.implement | UPDATE |
| POST | /api/safety/capas/:id/verify | Verify CAPA | capa.verify | VERIFY |
| POST | /api/safety/capas/:id/close | Close CAPA | capa.close | CLOSE |
| POST | /api/safety/capas/:id/extend | Extend due date | capa.extend_due_date | UPDATE |
| POST | /api/safety/capas/:id/attachments | Upload evidence | capa.update | UPDATE |

## H.3 Safety Inspections API

### Endpoints

| Method | Endpoint | Description | RBAC | Audit Event |
|--------|----------|-------------|------|-------------|
| GET | /api/safety/inspections | List inspections | inspection.view | - |
| GET | /api/safety/inspections/:id | Get inspection details | inspection.view | VIEW |
| POST | /api/safety/inspections | Schedule inspection | inspection.create_schedule | CREATE |
| POST | /api/safety/inspections/:id/start | Start inspection | inspection.perform | UPDATE |
| PUT | /api/safety/inspections/:id/responses | Save responses (auto-save) | inspection.perform | UPDATE |
| POST | /api/safety/inspections/:id/complete | Complete and sign | inspection.perform | SIGN |
| POST | /api/safety/inspections/:id/review | Supervisor review | inspection.review | APPROVE |
| GET | /api/safety/inspections/templates | List templates | inspection.view | - |
| POST | /api/safety/inspections/templates | Create template | inspection.create_template | CREATE |
| GET | /api/safety/inspections/schedule | Get inspection schedule | inspection.view | - |

## H.4 Safety Permits API

### Endpoints

| Method | Endpoint | Description | RBAC | Audit Event |
|--------|----------|-------------|------|-------------|
| GET | /api/safety/permits | List permits | permit.view | - |
| GET | /api/safety/permits/:id | Get permit details | permit.view | VIEW |
| POST | /api/safety/permits | Create permit draft | permit.request_* | CREATE |
| PUT | /api/safety/permits/:id | Update permit | permit.request_* | UPDATE |
| POST | /api/safety/permits/:id/submit | Submit for review | permit.request_* | SUBMIT |
| POST | /api/safety/permits/:id/review | Review permit | permit.review_* | UPDATE |
| POST | /api/safety/permits/:id/approve | Approve permit | permit.approve_* | APPROVE |
| POST | /api/safety/permits/:id/activate | Activate permit | permit.holder | UPDATE |
| POST | /api/safety/permits/:id/signoff | Add signoff | permit.signoff | SIGN |
| POST | /api/safety/permits/:id/suspend | Suspend permit | permit.suspend | UPDATE |
| POST | /api/safety/permits/:id/complete | Complete work | permit.holder | UPDATE |
| POST | /api/safety/permits/:id/close | Close permit | permit.holder | CLOSE |
| POST | /api/safety/permits/:id/cancel | Cancel permit | permit.cancel | UPDATE |
| GET | /api/safety/permits/active | List active permits | permit.view | - |
| GET | /api/safety/permits/types/:type/requirements | Get permit type requirements | permit.view | - |

## H.5 Safety Training API

### Endpoints

| Method | Endpoint | Description | RBAC | Audit Event |
|--------|----------|-------------|------|-------------|
| GET | /api/safety/training/courses | List courses | training.view | - |
| GET | /api/safety/training/courses/:id | Get course details | training.view | VIEW |
| POST | /api/safety/training/courses | Create course | training.manage_courses | CREATE |
| PUT | /api/safety/training/courses/:id | Update course | training.manage_courses | UPDATE |
| GET | /api/safety/training/assignments | List assignments | training.view | - |
| POST | /api/safety/training/assignments | Create assignment | training.assign | CREATE |
| POST | /api/safety/training/assignments/:id/start | Start training | training.complete | UPDATE |
| POST | /api/safety/training/assignments/:id/complete | Complete training | training.complete | SIGN |
| POST | /api/safety/training/assignments/:id/practical | Record practical eval | training.verify_practical | SIGN |
| POST | /api/safety/training/assignments/:id/waive | Waive training | training.waive | UPDATE |
| GET | /api/safety/training/my-training | My training dashboard | training.complete | - |
| GET | /api/safety/training/compliance | Compliance report | training.view_compliance | - |
| GET | /api/safety/training/certifications | Certification status | training.view | - |

## H.6 Safety Policies API

### Endpoints

| Method | Endpoint | Description | RBAC | Audit Event |
|--------|----------|-------------|------|-------------|
| GET | /api/safety/policies | List policies | policy.view | - |
| GET | /api/safety/policies/:id | Get policy details | policy.view | VIEW |
| POST | /api/safety/policies | Create policy | policy.create | CREATE |
| PUT | /api/safety/policies/:id | Update policy | policy.edit | UPDATE |
| POST | /api/safety/policies/:id/submit-review | Submit for review | policy.edit | SUBMIT |
| POST | /api/safety/policies/:id/approve | Approve policy | policy.approve | APPROVE |
| POST | /api/safety/policies/:id/publish | Publish policy | policy.publish | UPDATE |
| POST | /api/safety/policies/:id/archive | Archive policy | policy.archive | UPDATE |
| GET | /api/safety/policies/:id/acknowledgements | List acknowledgements | policy.view | - |
| POST | /api/safety/policies/:id/acknowledge | Acknowledge policy | policy.acknowledge | SIGN |
| GET | /api/safety/policies/my-acknowledgements | My pending acknowledgements | policy.acknowledge | - |

## H.7 Safety SDS API

### Endpoints

| Method | Endpoint | Description | RBAC | Audit Event |
|--------|----------|-------------|------|-------------|
| GET | /api/safety/sds | List SDS records | sds.view | - |
| GET | /api/safety/sds/:id | Get SDS details | sds.view | VIEW |
| GET | /api/safety/sds/search | Search SDS | sds.view | - |
| POST | /api/safety/sds | Create SDS record | sds.manage | CREATE |
| PUT | /api/safety/sds/:id | Update SDS record | sds.manage | UPDATE |
| POST | /api/safety/sds/:id/revisions | Upload new revision | sds.manage | CREATE |
| GET | /api/safety/sds/:id/pdf | Get SDS PDF | sds.view | - |
| GET | /api/safety/sds/by-location/:locationId | SDS by location | sds.view | - |

## H.8 Safety Assets (Equipment) API

### Endpoints

| Method | Endpoint | Description | RBAC | Audit Event |
|--------|----------|-------------|------|-------------|
| GET | /api/safety/assets | List equipment | equipment.view | - |
| GET | /api/safety/assets/:id | Get equipment details | equipment.view | VIEW |
| POST | /api/safety/assets | Create equipment | equipment.create | CREATE |
| PUT | /api/safety/assets/:id | Update equipment | equipment.update | UPDATE |
| POST | /api/safety/assets/:id/out-of-service | Mark out of service | equipment.out_of_service | UPDATE |
| POST | /api/safety/assets/:id/return-to-service | Return to service | equipment.return_to_service | UPDATE |
| GET | /api/safety/assets/:id/loto-procedure | Get LOTO procedure | equipment.view | VIEW |
| POST | /api/safety/assets/:id/loto-procedure | Create/update LOTO procedure | equipment.create_loto_proc | CREATE |
| POST | /api/safety/assets/:id/loto-procedure/approve | Approve LOTO procedure | equipment.approve_loto_proc | APPROVE |
| GET | /api/safety/assets/:id/inspections | Get inspection history | equipment.view | - |
| GET | /api/safety/assets/:id/incidents | Get incident history | equipment.view | - |

## H.9 Safety Audits API

### Endpoints

| Method | Endpoint | Description | RBAC | Audit Event |
|--------|----------|-------------|------|-------------|
| GET | /api/safety/audits | List audits | audit.view | - |
| GET | /api/safety/audits/:id | Get audit details | audit.view | VIEW |
| POST | /api/safety/audits | Create audit | audit.create | CREATE |
| PUT | /api/safety/audits/:id | Update audit | audit.update | UPDATE |
| POST | /api/safety/audits/:id/findings | Add finding | audit.update | CREATE |
| PUT | /api/safety/audits/:id/findings/:findingId | Update finding | audit.update | UPDATE |
| POST | /api/safety/audits/:id/complete | Complete audit | audit.complete | UPDATE |
| POST | /api/safety/audits/:id/report | Generate report | audit.complete | CREATE |

## H.10 Safety KPIs API

### Endpoints

| Method | Endpoint | Description | RBAC | Audit Event |
|--------|----------|-------------|------|-------------|
| GET | /api/safety/kpis/summary | KPI summary | kpi.view | - |
| GET | /api/safety/kpis/trir | TRIR calculation | kpi.view | - |
| GET | /api/safety/kpis/dart | DART rate | kpi.view | - |
| GET | /api/safety/kpis/leading-indicators | Leading indicators | kpi.view | - |
| GET | /api/safety/kpis/trends | Trend data | kpi.view | - |
| GET | /api/safety/kpis/by-location | KPIs by location | kpi.view | - |
| POST | /api/safety/kpis/export | Export KPI report | kpi.export | EXPORT |

## H.11 Example Request/Response Payloads

### H.11.1 Create Incident with Photo Upload

**Request:**
```http
POST /api/safety/incidents
Content-Type: multipart/form-data
Authorization: Bearer <token>

{
  "type": "NEAR_MISS",
  "locationId": "loc_cleveland_01",
  "workCenterId": "wc_saw_01",
  "occurredAt": "2026-02-03T14:30:00Z",
  "description": "Forklift came within 2 feet of pedestrian at dock corner. No contact made.",
  "affectedPersonType": "EMPLOYEE",
  "immediateActions": "Both parties stopped. Supervisor notified. Area reviewed.",
  "equipmentAssetIds": ["fl_003"],
  "photos": [<binary file 1>, <binary file 2>]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "inc_2026_0089",
    "incidentNumber": "INC-2026-0089",
    "type": "NEAR_MISS",
    "status": "DRAFT",
    "locationId": "loc_cleveland_01",
    "workCenterId": "wc_saw_01",
    "occurredAt": "2026-02-03T14:30:00Z",
    "reportedAt": "2026-02-03T15:45:00Z",
    "reporterId": "user_john_smith",
    "description": "Forklift came within 2 feet of pedestrian at dock corner. No contact made.",
    "affectedPersonType": "EMPLOYEE",
    "immediateActions": "Both parties stopped. Supervisor notified. Area reviewed.",
    "equipmentAssetIds": ["fl_003"],
    "severity": null,
    "oshaRecordable": null,
    "attachments": [
      {
        "id": "att_001",
        "fileName": "dock_area_photo.jpg",
        "fileSize": 1245678,
        "mimeType": "image/jpeg",
        "url": "/api/safety/incidents/inc_2026_0089/attachments/att_001",
        "uploadedAt": "2026-02-03T15:45:00Z"
      },
      {
        "id": "att_002",
        "fileName": "forklift_position.jpg",
        "fileSize": 987654,
        "mimeType": "image/jpeg",
        "url": "/api/safety/incidents/inc_2026_0089/attachments/att_002",
        "uploadedAt": "2026-02-03T15:45:00Z"
      }
    ],
    "createdAt": "2026-02-03T15:45:00Z",
    "updatedAt": "2026-02-03T15:45:00Z",
    "_links": {
      "self": "/api/safety/incidents/inc_2026_0089",
      "submit": "/api/safety/incidents/inc_2026_0089/submit",
      "attachments": "/api/safety/incidents/inc_2026_0089/attachments"
    }
  },
  "auditEvent": {
    "id": "ae_2026_0892",
    "action": "CREATE",
    "resourceType": "INCIDENT",
    "resourceId": "inc_2026_0089"
  }
}
```

### H.11.2 Approve LOTO Permit with Signoff

**Request:**
```http
POST /api/safety/permits/prm_2026_0042/approve
Content-Type: application/json
Authorization: Bearer <token>

{
  "decision": "APPROVED",
  "comments": "Reviewed isolation points and JHA. Procedure is adequate.",
  "signoff": {
    "signature": "data:image/png;base64,iVBORw0KGgo...",
    "attestation": "I have reviewed this permit request and confirm that the work can proceed safely with the specified controls.",
    "signedAt": "2026-02-03T08:30:00Z"
  },
  "conditions": [
    "Verify all personnel have applied their locks before energization attempt",
    "Contact maintenance lead before re-energization"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "prm_2026_0042",
    "permitNumber": "LT-2026-0042",
    "type": "LOTO",
    "status": "APPROVED",
    "previousStatus": "PENDING_APPROVAL",
    "workDescription": "Replace blade and adjust guide on Band Saw #4",
    "equipmentAssetIds": ["bs_004"],
    "validFrom": "2026-02-03T08:30:00Z",
    "validTo": "2026-02-03T16:30:00Z",
    "issuerId": "user_mike_supervisor",
    "approvalDetails": {
      "approvedById": "user_mike_supervisor",
      "approvedAt": "2026-02-03T08:30:00Z",
      "comments": "Reviewed isolation points and JHA. Procedure is adequate.",
      "conditions": [
        "Verify all personnel have applied their locks before energization attempt",
        "Contact maintenance lead before re-energization"
      ]
    },
    "signoffs": [
      {
        "id": "sig_001",
        "userId": "user_mike_supervisor",
        "role": "APPROVER",
        "section": "APPROVAL",
        "signedAt": "2026-02-03T08:30:00Z",
        "attestation": "I have reviewed this permit request and confirm that the work can proceed safely with the specified controls.",
        "signatureHash": "sha256:abc123..."
      }
    ],
    "typeSpecificData": {
      "energySources": [
        {
          "id": "es_001",
          "type": "ELECTRICAL",
          "description": "480V 3-phase motor",
          "isolationMethod": "Disconnect breaker CB-SAW-04"
        },
        {
          "id": "es_002",
          "type": "PNEUMATIC",
          "description": "Blade tensioning cylinder",
          "isolationMethod": "Close valve PV-SAW-04-01"
        }
      ],
      "isolationPoints": [
        {
          "id": "ip_001",
          "energySourceId": "es_001",
          "location": "Electrical panel EP-04",
          "device": "Breaker CB-SAW-04",
          "lockRequired": true,
          "tagRequired": true
        },
        {
          "id": "ip_002",
          "energySourceId": "es_002",
          "location": "Pneumatic manifold PM-03",
          "device": "Ball valve PV-SAW-04-01",
          "lockRequired": true,
          "tagRequired": true
        }
      ],
      "groupLotoMode": false,
      "zeroEnergyVerified": false
    },
    "nextSteps": [
      "Authorized workers apply locks and tags",
      "Perform try-start verification",
      "Document zero-energy state",
      "Begin work"
    ],
    "_links": {
      "self": "/api/safety/permits/prm_2026_0042",
      "activate": "/api/safety/permits/prm_2026_0042/activate",
      "signoff": "/api/safety/permits/prm_2026_0042/signoff",
      "equipment": "/api/safety/assets/bs_004"
    }
  },
  "auditEvent": {
    "id": "ae_2026_0893",
    "action": "APPROVE",
    "resourceType": "PERMIT_LOTO",
    "resourceId": "prm_2026_0042",
    "actorId": "user_mike_supervisor",
    "signatureRecorded": true
  },
  "notifications": [
    {
      "recipientId": "user_john_operator",
      "type": "PERMIT_APPROVED",
      "channel": "PUSH"
    }
  ]
}
```

### H.11.3 Forklift Daily Inspection with Defect → Asset Out of Service

**Request:**
```http
POST /api/safety/inspections/ins_2026_0456/complete
Content-Type: application/json
Authorization: Bearer <token>

{
  "responses": [
    {"questionId": "q_001", "answer": "YES", "comment": null},
    {"questionId": "q_002", "answer": "YES", "comment": null},
    {"questionId": "q_003", "answer": "NO", "comment": "Brake pedal feels soft, not engaging fully"},
    {"questionId": "q_004", "answer": "YES", "comment": null},
    {"questionId": "q_005", "answer": "YES", "comment": null},
    {"questionId": "q_006", "answer": "YES", "comment": null},
    {"questionId": "q_007", "answer": "YES", "comment": null},
    {"questionId": "q_008", "answer": "YES", "comment": null},
    {"questionId": "q_009", "answer": "YES", "comment": null},
    {"questionId": "q_010", "answer": "YES", "comment": null}
  ],
  "defects": [
    {
      "questionId": "q_003",
      "severity": "CRITICAL",
      "description": "Service brake pedal soft, does not engage fully. Unsafe to operate.",
      "photos": ["data:image/jpeg;base64,/9j/4AAQ..."]
    }
  ],
  "overallResult": "FAIL",
  "inspectorSignoff": {
    "signature": "data:image/png;base64,iVBORw0KGgo...",
    "attestation": "I have completed this inspection accurately and to the best of my ability.",
    "signedAt": "2026-02-03T06:15:00Z"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "inspection": {
      "id": "ins_2026_0456",
      "inspectionNumber": "INS-2026-0456",
      "type": "FORKLIFT_DAILY",
      "status": "COMPLETED",
      "equipmentAssetId": "fl_005",
      "overallResult": "FAIL",
      "score": 90,
      "completedAt": "2026-02-03T06:15:00Z",
      "inspectorId": "user_bob_operator",
      "defectCount": 1,
      "criticalDefectCount": 1
    },
    "defects": [
      {
        "id": "def_2026_0078",
        "inspectionId": "ins_2026_0456",
        "questionId": "q_003",
        "severity": "CRITICAL",
        "description": "Service brake pedal soft, does not engage fully. Unsafe to operate.",
        "photos": [
          {
            "id": "att_003",
            "url": "/api/safety/inspections/ins_2026_0456/defects/def_2026_0078/photos/att_003"
          }
        ],
        "capaId": "capa_2026_0034"
      }
    ],
    "equipmentStatusChange": {
      "assetId": "fl_005",
      "assetNumber": "FL-005",
      "previousStatus": "SAFE",
      "newStatus": "OUT_OF_SERVICE_SAFETY",
      "reason": "Critical defect: Brake failure - Inspection INS-2026-0456",
      "changedAt": "2026-02-03T06:15:00Z",
      "changedBy": "SYSTEM"
    },
    "capaCreated": {
      "id": "capa_2026_0034",
      "capaNumber": "CAPA-2026-0034",
      "type": "CORRECTIVE",
      "status": "ASSIGNED",
      "priority": "HIGH",
      "title": "Repair brake system on Forklift FL-005",
      "assignedToId": "user_maintenance_lead",
      "dueDate": "2026-02-03T18:00:00Z",
      "sourceType": "INSPECTION",
      "sourceId": "ins_2026_0456"
    },
    "notifications": [
      {
        "recipientRole": "MAINTENANCE_LEAD",
        "type": "CRITICAL_DEFECT",
        "message": "Critical defect on FL-005: Brake failure. Equipment OUT OF SERVICE."
      },
      {
        "recipientRole": "SUPERVISOR",
        "type": "EQUIPMENT_OUT_OF_SERVICE",
        "message": "Forklift FL-005 is OUT OF SERVICE due to brake failure."
      },
      {
        "recipientRole": "OPS_MANAGER",
        "type": "EQUIPMENT_OUT_OF_SERVICE",
        "message": "Forklift FL-005 is OUT OF SERVICE. 1 critical defect pending repair."
      }
    ],
    "dispatchImpact": {
      "blocked": true,
      "equipmentId": "fl_005",
      "message": "Forklift FL-005 cannot be dispatched until returned to service"
    },
    "_links": {
      "inspection": "/api/safety/inspections/ins_2026_0456",
      "equipment": "/api/safety/assets/fl_005",
      "capa": "/api/safety/capas/capa_2026_0034",
      "returnToService": "/api/safety/assets/fl_005/return-to-service"
    }
  },
  "auditEvents": [
    {
      "id": "ae_2026_0894",
      "action": "SIGN",
      "resourceType": "INSPECTION",
      "resourceId": "ins_2026_0456"
    },
    {
      "id": "ae_2026_0895",
      "action": "CREATE",
      "resourceType": "INSPECTION_DEFECT",
      "resourceId": "def_2026_0078"
    },
    {
      "id": "ae_2026_0896",
      "action": "UPDATE",
      "resourceType": "EQUIPMENT_ASSET",
      "resourceId": "fl_005",
      "previousState": {"safetyStatus": "SAFE"},
      "newState": {"safetyStatus": "OUT_OF_SERVICE_SAFETY"}
    },
    {
      "id": "ae_2026_0897",
      "action": "CREATE",
      "resourceType": "CAPA",
      "resourceId": "capa_2026_0034"
    }
  ]
}
```

---

================================================================================
# I) EVENTING + AUDIT + EVIDENCE
================================================================================

## I.1 Immutable Audit Log Architecture

### I.1.1 Audit Event Structure

```typescript
interface SafetyAuditEvent {
  // Identity (immutable after creation)
  id: string;                    // UUID v7 (time-ordered)
  tenantId: string;
  correlationId: string;         // Groups related events
  
  // Actor information
  actor: {
    id: string;                  // User ID or 'SYSTEM'
    type: ActorType;             // USER, SYSTEM, API_KEY, INTEGRATION
    name: string;                // Display name at time of event
    roles: string[];             // Roles at time of event
    ip?: string;
    userAgent?: string;
    sessionId?: string;
  };
  
  // Action details
  action: AuditAction;
  resourceType: ResourceType;
  resourceId: string;
  resourceLabel?: string;        // Human-readable label
  
  // Change tracking
  changes: {
    previousState?: object;      // Snapshot before (for updates)
    newState?: object;           // Snapshot after
    changedFields?: string[];    // List of changed field names
    summary: string;             // Human-readable summary
  };
  
  // Context
  context: {
    locationId?: string;
    workCenterId?: string;
    workflowState?: string;
    triggerSource?: string;      // What initiated this action
    parentEventId?: string;      // For cascading actions
  };
  
  // Signature (if applicable)
  signature?: {
    signerId: string;
    signerName: string;
    signedAt: DateTime;
    signatureValue: string;      // Base64 encoded
    signatureMethod: SignatureMethod;
    attestation: string;         // Text that was attested to
    attestationHash: string;     // SHA-256 of attestation
  };
  
  // Metadata
  reason?: string;               // User-provided reason for action
  tags?: string[];               // Searchable tags
  
  // Timestamp (database-controlled)
  occurredAt: DateTime;          // Set by database trigger, not application
  
  // Integrity
  sequenceNumber: bigint;        // Tenant-scoped sequence
  previousEventHash: string;     // SHA-256 of previous event
  eventHash: string;             // SHA-256 of this event
}
```

### I.1.2 Immutability Enforcement

```sql
-- Database-level immutability

-- 1. Trigger to set timestamp and prevent updates
CREATE OR REPLACE FUNCTION enforce_audit_immutability()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Set timestamp at database level
    NEW.occurred_at := NOW();
    
    -- Calculate sequence number
    SELECT COALESCE(MAX(sequence_number), 0) + 1
    INTO NEW.sequence_number
    FROM safety_audit_events
    WHERE tenant_id = NEW.tenant_id;
    
    -- Get previous event hash
    SELECT event_hash
    INTO NEW.previous_event_hash
    FROM safety_audit_events
    WHERE tenant_id = NEW.tenant_id
    ORDER BY sequence_number DESC
    LIMIT 1;
    
    -- Calculate this event's hash
    NEW.event_hash := encode(
      sha256(
        (NEW.id || NEW.actor::text || NEW.action || NEW.resource_type || 
         NEW.resource_id || NEW.changes::text || NEW.occurred_at::text ||
         COALESCE(NEW.previous_event_hash, ''))::bytea
      ),
      'hex'
    );
    
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Audit events are immutable and cannot be modified or deleted';
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_audit_immutability_trigger
BEFORE INSERT OR UPDATE OR DELETE ON safety_audit_events
FOR EACH ROW EXECUTE FUNCTION enforce_audit_immutability();

-- 2. Revoke direct table permissions
REVOKE UPDATE, DELETE ON safety_audit_events FROM PUBLIC;
REVOKE UPDATE, DELETE ON safety_audit_events FROM app_user;

-- 3. Only allow inserts through function
CREATE OR REPLACE FUNCTION log_safety_audit_event(event_data jsonb)
RETURNS uuid AS $$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO safety_audit_events (
    id, tenant_id, correlation_id, actor, action, 
    resource_type, resource_id, resource_label,
    changes, context, signature, reason, tags
  )
  VALUES (
    gen_random_uuid(),
    event_data->>'tenant_id',
    event_data->>'correlation_id',
    event_data->'actor',
    event_data->>'action',
    event_data->>'resource_type',
    event_data->>'resource_id',
    event_data->>'resource_label',
    event_data->'changes',
    event_data->'context',
    event_data->'signature',
    event_data->>'reason',
    ARRAY(SELECT jsonb_array_elements_text(event_data->'tags'))
  )
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### I.1.3 Hash Chain Verification

```typescript
async function verifyAuditChainIntegrity(
  tenantId: string,
  startSequence?: number,
  endSequence?: number
): Promise<ChainVerificationResult> {
  const events = await db.safetyAuditEvents.findMany({
    where: {
      tenantId,
      sequenceNumber: {
        gte: startSequence ?? 1,
        lte: endSequence
      }
    },
    orderBy: { sequenceNumber: 'asc' }
  });
  
  const issues: ChainIssue[] = [];
  let previousHash: string | null = null;
  
  for (const event of events) {
    // Verify previous hash link
    if (previousHash && event.previousEventHash !== previousHash) {
      issues.push({
        type: 'BROKEN_CHAIN',
        sequenceNumber: event.sequenceNumber,
        expected: previousHash,
        actual: event.previousEventHash
      });
    }
    
    // Verify event hash
    const calculatedHash = calculateEventHash(event);
    if (calculatedHash !== event.eventHash) {
      issues.push({
        type: 'HASH_MISMATCH',
        sequenceNumber: event.sequenceNumber,
        expected: calculatedHash,
        actual: event.eventHash
      });
    }
    
    previousHash = event.eventHash;
  }
  
  return {
    valid: issues.length === 0,
    eventsChecked: events.length,
    issues
  };
}
```

## I.2 Electronic Signature Implementation

### I.2.1 Signature Requirements (21 CFR Part 11 Inspired)

```typescript
interface ElectronicSignature {
  // Signer identification
  signerId: string;
  signerName: string;
  signerCredential: string;      // How identity was verified
  
  // Signature data
  signedAt: DateTime;
  signatureValue: string;        // Captured signature image (base64)
  signatureMethod: SignatureMethod;
  
  // Attestation
  attestation: string;           // What they're attesting to
  attestationHash: string;       // SHA-256 of attestation text
  
  // Context
  documentId: string;
  documentVersion: number;
  documentHash: string;          // Hash of document at time of signing
  
  // Verification
  ip: string;
  userAgent: string;
  mfaVerified: boolean;
  sessionId: string;
}

enum SignatureMethod {
  DRAWN = 'DRAWN',               // Touch/mouse drawn signature
  TYPED = 'TYPED',               // Typed name with password confirm
  BIOMETRIC = 'BIOMETRIC',       // Fingerprint, etc.
  CERTIFICATE = 'CERTIFICATE'    // PKI certificate
}

// Signature capture workflow
async function captureSignature(
  userId: string,
  documentId: string,
  attestationType: AttestationType,
  signatureData: SignatureInput
): Promise<ElectronicSignature> {
  // 1. Verify user identity
  const user = await verifyUserIdentity(userId, signatureData.password);
  if (!user) {
    throw new Error('Identity verification failed');
  }
  
  // 2. Get document state
  const document = await getDocument(documentId);
  const documentHash = calculateDocumentHash(document);
  
  // 3. Get attestation text
  const attestation = getAttestationText(attestationType, document);
  
  // 4. Create signature record
  const signature: ElectronicSignature = {
    signerId: user.id,
    signerName: user.fullName,
    signerCredential: 'PASSWORD',
    signedAt: new Date(),
    signatureValue: signatureData.drawnSignature,
    signatureMethod: SignatureMethod.DRAWN,
    attestation,
    attestationHash: sha256(attestation),
    documentId,
    documentVersion: document.version,
    documentHash,
    ip: signatureData.clientIp,
    userAgent: signatureData.userAgent,
    mfaVerified: user.mfaEnabled,
    sessionId: signatureData.sessionId
  };
  
  // 5. Log signature event
  await logAuditEvent({
    action: 'SIGN',
    resourceType: document.type,
    resourceId: documentId,
    signature
  });
  
  return signature;
}

const attestationTexts: Record<AttestationType, (doc: any) => string> = {
  PERMIT_APPROVAL: (doc) => 
    `I have reviewed permit ${doc.permitNumber} and confirm that the work can proceed safely with the specified controls. I understand that I am authorizing work that may involve hazardous energy or other safety-critical activities.`,
  
  INSPECTION_COMPLETION: (doc) =>
    `I have completed inspection ${doc.inspectionNumber} accurately and to the best of my ability. All responses reflect the actual condition of the equipment/area at the time of inspection.`,
  
  TRAINING_COMPLETION: (doc) =>
    `I have completed the training course "${doc.courseName}" and understand the material presented. I commit to applying this knowledge in my work activities.`,
  
  POLICY_ACKNOWLEDGEMENT: (doc) =>
    `I have read, understand, and agree to comply with ${doc.title} (Version ${doc.version}, effective ${doc.effectiveDate}). I understand that failure to comply may result in disciplinary action.`,
  
  INCIDENT_REPORT: (doc) =>
    `I attest that the information provided in this incident report is accurate and complete to the best of my knowledge. I understand the importance of accurate incident reporting for workplace safety.`,
  
  LOTO_VERIFICATION: (doc) =>
    `I have verified that all energy sources for ${doc.equipmentName} have been isolated and locked out as specified. I have performed try-start verification and confirmed zero-energy state.`
};
```

## I.3 Evidence and Attachment Handling

### I.3.1 Attachment Management

```typescript
interface SafetyAttachment {
  id: string;
  tenantId: string;
  
  // Ownership
  parentType: ResourceType;
  parentId: string;
  
  // File info
  fileName: string;
  fileSize: number;
  mimeType: string;
  
  // Storage
  storageProvider: 'S3' | 'AZURE_BLOB' | 'GCS';
  storagePath: string;
  storageUrl: string;            // Pre-signed URL (short-lived)
  
  // Integrity
  fileHash: string;              // SHA-256 of file content
  virusScanStatus: VirusScanStatus;
  virusScannedAt?: DateTime;
  
  // Metadata
  category: AttachmentCategory;
  description?: string;
  capturedAt?: DateTime;         // When photo was taken
  capturedLocation?: GeoLocation;
  
  // Access control
  visibility: AttachmentVisibility;
  
  // Upload info
  uploadedById: string;
  uploadedAt: DateTime;
  
  // Lifecycle
  retentionCategory: RetentionCategory;
  expiresAt?: DateTime;
  deletedAt?: DateTime;
  deletedById?: string;
}

enum AttachmentCategory {
  INCIDENT_PHOTO = 'INCIDENT_PHOTO',
  INSPECTION_PHOTO = 'INSPECTION_PHOTO',
  DEFECT_PHOTO = 'DEFECT_PHOTO',
  CAPA_EVIDENCE = 'CAPA_EVIDENCE',
  PERMIT_ATTACHMENT = 'PERMIT_ATTACHMENT',
  TRAINING_CERTIFICATE = 'TRAINING_CERTIFICATE',
  POLICY_DOCUMENT = 'POLICY_DOCUMENT',
  SDS_PDF = 'SDS_PDF',
  SIGNATURE_IMAGE = 'SIGNATURE_IMAGE',
  INVESTIGATION_EVIDENCE = 'INVESTIGATION_EVIDENCE',
  AUDIT_EVIDENCE = 'AUDIT_EVIDENCE'
}

// Upload workflow with integrity verification
async function uploadSafetyAttachment(
  file: File,
  metadata: AttachmentMetadata,
  userId: string
): Promise<SafetyAttachment> {
  // 1. Validate file type
  if (!allowedMimeTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} not allowed`);
  }
  
  // 2. Check file size
  if (file.size > maxFileSizes[metadata.category]) {
    throw new Error('File exceeds maximum size');
  }
  
  // 3. Calculate hash
  const fileBuffer = await file.arrayBuffer();
  const fileHash = await crypto.subtle.digest('SHA-256', fileBuffer);
  const hashHex = Array.from(new Uint8Array(fileHash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // 4. Virus scan
  const scanResult = await virusScanner.scan(fileBuffer);
  if (scanResult.infected) {
    throw new Error('File failed virus scan');
  }
  
  // 5. Upload to storage
  const storagePath = generateStoragePath(metadata);
  await storage.upload(storagePath, fileBuffer, {
    contentType: file.type,
    metadata: {
      originalName: file.name,
      uploadedBy: userId,
      hash: hashHex
    }
  });
  
  // 6. Create attachment record
  const attachment = await db.safetyAttachments.create({
    data: {
      id: generateId(),
      tenantId: metadata.tenantId,
      parentType: metadata.parentType,
      parentId: metadata.parentId,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      storageProvider: 'S3',
      storagePath,
      fileHash: hashHex,
      virusScanStatus: 'CLEAN',
      virusScannedAt: new Date(),
      category: metadata.category,
      description: metadata.description,
      visibility: metadata.visibility,
      uploadedById: userId,
      uploadedAt: new Date(),
      retentionCategory: getRetentionCategory(metadata.category)
    }
  });
  
  // 7. Log audit event
  await logAuditEvent({
    action: 'CREATE',
    resourceType: 'ATTACHMENT',
    resourceId: attachment.id,
    context: {
      parentType: metadata.parentType,
      parentId: metadata.parentId
    }
  });
  
  return attachment;
}
```

### I.3.2 Evidence Package Generation

```typescript
interface EvidencePackage {
  id: string;
  generatedAt: DateTime;
  generatedById: string;
  
  // Content
  title: string;
  description: string;
  coverPage: {
    tenantName: string;
    locationName: string;
    packageType: string;
    generatedDate: string;
    caseNumber?: string;
  };
  
  // Included items
  sections: EvidenceSection[];
  
  // Output
  pdfUrl: string;
  pdfHash: string;
  zipUrl?: string;               // ZIP with all attachments
}

interface EvidenceSection {
  title: string;
  items: EvidenceItem[];
}

interface EvidenceItem {
  type: 'DOCUMENT' | 'RECORD' | 'ATTACHMENT' | 'AUDIT_TRAIL';
  title: string;
  content?: string;              // For records
  attachmentId?: string;         // For attachments
  auditEvents?: SafetyAuditEvent[]; // For audit trail
  includeInPdf: boolean;
}

// Generate evidence package for an incident
async function generateIncidentEvidencePackage(
  incidentId: string,
  options: PackageOptions
): Promise<EvidencePackage> {
  const incident = await getIncidentWithRelations(incidentId);
  
  const sections: EvidenceSection[] = [];
  
  // 1. Incident Report Section
  sections.push({
    title: 'Incident Report',
    items: [
      {
        type: 'RECORD',
        title: 'Incident Details',
        content: formatIncidentDetails(incident),
        includeInPdf: true
      }
    ]
  });
  
  // 2. Investigation Section (if applicable)
  if (incident.investigation) {
    sections.push({
      title: 'Investigation',
      items: [
        {
          type: 'RECORD',
          title: 'Investigation Report',
          content: formatInvestigation(incident.investigation),
          includeInPdf: true
        },
        {
          type: 'RECORD',
          title: 'Root Cause Analysis',
          content: formatRootCauseAnalysis(incident.investigation),
          includeInPdf: true
        }
      ]
    });
  }
  
  // 3. Photos and Evidence
  const photos = incident.attachments.filter(a => 
    a.category === 'INCIDENT_PHOTO' || a.category === 'INVESTIGATION_EVIDENCE'
  );
  if (photos.length > 0) {
    sections.push({
      title: 'Photographic Evidence',
      items: photos.map(photo => ({
        type: 'ATTACHMENT',
        title: photo.description || photo.fileName,
        attachmentId: photo.id,
        includeInPdf: options.includePhotosInPdf
      }))
    });
  }
  
  // 4. CAPA Summary
  if (incident.capas.length > 0) {
    sections.push({
      title: 'Corrective Actions',
      items: incident.capas.map(capa => ({
        type: 'RECORD',
        title: `CAPA ${capa.capaNumber}`,
        content: formatCapaSummary(capa),
        includeInPdf: true
      }))
    });
  }
  
  // 5. Audit Trail
  const auditEvents = await getAuditEventsForIncident(incidentId);
  sections.push({
    title: 'Audit Trail',
    items: [{
      type: 'AUDIT_TRAIL',
      title: 'Complete Event History',
      auditEvents,
      includeInPdf: true
    }]
  });
  
  // 6. Signatures
  const signatures = collectAllSignatures(incident);
  sections.push({
    title: 'Signatures and Attestations',
    items: signatures.map(sig => ({
      type: 'RECORD',
      title: `${sig.signerName} - ${sig.purpose}`,
      content: formatSignatureRecord(sig),
      includeInPdf: true
    }))
  });
  
  // Generate PDF and ZIP
  const pdf = await generatePdf(sections, incident);
  const zip = options.includeAttachments 
    ? await generateZip(sections, incident)
    : null;
  
  // Create package record
  const package = await db.evidencePackages.create({
    data: {
      id: generateId(),
      tenantId: incident.tenantId,
      relatedType: 'INCIDENT',
      relatedId: incidentId,
      title: `Evidence Package - Incident ${incident.incidentNumber}`,
      generatedById: options.userId,
      generatedAt: new Date(),
      pdfUrl: pdf.url,
      pdfHash: pdf.hash,
      zipUrl: zip?.url,
      sections: JSON.stringify(sections)
    }
  });
  
  // Log generation
  await logAuditEvent({
    action: 'EXPORT',
    resourceType: 'EVIDENCE_PACKAGE',
    resourceId: package.id,
    context: {
      incidentId,
      includedSections: sections.map(s => s.title)
    }
  });
  
  return package;
}
```

## I.4 Retention Policy

### I.4.1 Retention Categories

| Category | Default Retention | Regulatory Basis | Notes |
|----------|------------------|------------------|-------|
| OSHA_RECORDABLE | 5 years + current | 29 CFR 1904.33 | Minimum 5 years |
| TRAINING_RECORDS | Employment + 3 years | Various OSHA standards | Some require longer |
| EXPOSURE_RECORDS | 30 years | 29 CFR 1910.1020 | Medical/exposure |
| LOTO_PROCEDURES | Active + 3 years | Best practice | Keep while equipment active |
| PERMITS | 3 years | Best practice | Regulatory may vary |
| INSPECTIONS | 3 years | Best practice | Equipment-specific may vary |
| POLICIES | Superseded + 5 years | Best practice | Keep version history |
| AUDIT_EVENTS | 7 years | Best practice | Consider legal holds |
| SDS | Active + 30 years | 29 CFR 1910.1020 | Exposure-related |
| GENERAL_SAFETY | 5 years | Best practice | Default category |

### I.4.2 Retention Implementation

```typescript
interface RetentionPolicy {
  tenantId: string;
  category: RetentionCategory;
  retentionYears: number;
  retentionBasis: string;        // Regulatory reference
  autoArchive: boolean;
  autoDelete: boolean;
  legalHoldOverride: boolean;
  reviewRequired: boolean;
  notifyBeforeExpiry: number;    // Days
}

// Retention enforcement job
async function enforceRetentionPolicies(tenantId: string): Promise<RetentionJobResult> {
  const policies = await getRetentionPolicies(tenantId);
  const results: RetentionActionResult[] = [];
  
  for (const policy of policies) {
    // Find records past retention date
    const expiredRecords = await findExpiredRecords(
      tenantId,
      policy.category,
      policy.retentionYears
    );
    
    for (const record of expiredRecords) {
      // Check for legal hold
      if (await hasLegalHold(record.id)) {
        results.push({
          recordId: record.id,
          action: 'HELD',
          reason: 'Legal hold active'
        });
        continue;
      }
      
      // Check if review required
      if (policy.reviewRequired) {
        await createRetentionReviewTask(record, policy);
        results.push({
          recordId: record.id,
          action: 'REVIEW_REQUESTED',
          reason: 'Pending review before action'
        });
        continue;
      }
      
      // Archive or delete
      if (policy.autoArchive) {
        await archiveRecord(record);
        results.push({
          recordId: record.id,
          action: 'ARCHIVED',
          archivedAt: new Date()
        });
      }
      
      if (policy.autoDelete) {
        await deleteRecord(record);
        results.push({
          recordId: record.id,
          action: 'DELETED',
          deletedAt: new Date()
        });
      }
    }
  }
  
  // Log retention job execution
  await logAuditEvent({
    action: 'SYSTEM_RETENTION',
    resourceType: 'RETENTION_JOB',
    resourceId: generateId(),
    changes: {
      summary: `Processed ${results.length} records`,
      newState: { results }
    }
  });
  
  return { processed: results.length, results };
}
```

---

*Continued in Part 4: KPIs + Reports (J), Testing Plan (K), Rollout Plan (L)*
