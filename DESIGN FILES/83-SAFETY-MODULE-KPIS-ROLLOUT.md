# 83-SAFETY-MODULE-KPIS-ROLLOUT.md
# Safety Module Specification - Part 4
## KPIs, Reports, Testing Plan, and Rollout

---

================================================================================
# J) KPIs + REPORTS
================================================================================

## J.1 Lagging Indicators (Outcome Metrics)

### J.1.1 OSHA Recordkeeping Metrics

```typescript
interface OshaMetrics {
  // Total Recordable Incident Rate (TRIR)
  trir: {
    formula: '(Total Recordables × 200,000) / Total Hours Worked';
    components: {
      totalRecordables: number;        // Deaths + DAW + DJTR + Other recordables
      totalHoursWorked: number;        // All employee hours
    };
    value: number;
    benchmark: {
      industry: number;                // Industry average from BLS
      company: number;                 // Company target
    };
    period: 'YTD' | '12_MONTH_ROLLING' | 'QUARTERLY';
  };
  
  // Days Away, Restricted, or Transferred Rate (DART)
  dart: {
    formula: '(DAW + DJTR Cases × 200,000) / Total Hours Worked';
    components: {
      dawCases: number;                // Days away from work cases
      djtrCases: number;               // Days of job transfer/restriction
      totalHoursWorked: number;
    };
    value: number;
    benchmark: {
      industry: number;
      company: number;
    };
    period: 'YTD' | '12_MONTH_ROLLING' | 'QUARTERLY';
  };
  
  // Lost Time Incident Rate (LTIR)
  ltir: {
    formula: '(Lost Time Cases × 200,000) / Total Hours Worked';
    components: {
      lostTimeCases: number;
      totalHoursWorked: number;
    };
    value: number;
  };
  
  // Severity Rate
  severityRate: {
    formula: '(Total Days Lost × 200,000) / Total Hours Worked';
    components: {
      totalDaysLost: number;
      totalHoursWorked: number;
    };
    value: number;
  };
  
  // Days Since Last Recordable
  daysSinceLastRecordable: number;
  
  // Breakdown by type
  incidentsByType: Record<OshaClassification, number>;
  incidentsByBodyPart: Record<string, number>;
  incidentsByNature: Record<string, number>;
  incidentsByLocation: Record<string, number>;
}

// TRIR Calculation
async function calculateTRIR(
  tenantId: string,
  locationIds: string[],
  period: { start: DateTime; end: DateTime }
): Promise<TRIRResult> {
  // Get recordable incidents
  const recordables = await db.incidents.count({
    where: {
      tenantId,
      locationId: { in: locationIds },
      occurredAt: { gte: period.start, lte: period.end },
      oshaRecordable: true,
      oshaClassification: {
        not: 'NOT_RECORDABLE'
      }
    }
  });
  
  // Get hours worked from HR/Payroll integration or manual entry
  const hoursWorked = await getHoursWorked(tenantId, locationIds, period);
  
  // Calculate TRIR
  const trir = (recordables * 200000) / hoursWorked;
  
  // Get benchmark
  const benchmark = await getIndustryBenchmark('METALS_SERVICE_CENTER');
  
  return {
    value: Math.round(trir * 100) / 100,
    recordables,
    hoursWorked,
    period,
    benchmark: benchmark.trir,
    trend: await calculateTrend(tenantId, 'TRIR', period)
  };
}
```

### J.1.2 Additional Lagging Indicators

| Metric | Formula | Target | Frequency |
|--------|---------|--------|-----------|
| First Aid Rate | (First Aid Cases × 200,000) / Hours | < 10.0 | Monthly |
| Near Miss Rate | (Near Misses × 200,000) / Hours | Monitor trend | Monthly |
| Property Damage Rate | Property Damage Incidents / Month | Decreasing | Monthly |
| Workers Comp Cost | Total WC Costs / 100 Employees | Decreasing | Quarterly |
| EMR (Experience Mod Rate) | From insurer | < 1.0 | Annual |
| Vehicle Incident Rate | Vehicle Incidents / Million Miles | < 2.0 | Monthly |

## J.2 Leading Indicators (Proactive Metrics)

### J.2.1 Inspection Compliance

```typescript
interface InspectionKPIs {
  // Inspection completion rate
  completionRate: {
    formula: 'Completed On Time / Total Scheduled';
    current: number;                   // Percentage
    target: number;                    // e.g., 95%
    byType: Record<InspectionType, {
      scheduled: number;
      completed: number;
      onTime: number;
      rate: number;
    }>;
    byLocation: Record<string, number>;
  };
  
  // Defect discovery rate
  defectRate: {
    totalInspections: number;
    inspectionsWithDefects: number;
    defectsByserverity: Record<DefectSeverity, number>;
    criticalDefectCount: number;
  };
  
  // Defect resolution time
  defectResolutionTime: {
    average: number;                   // Days
    byPriority: Record<Priority, number>;
    overdue: number;
  };
  
  // Equipment uptime (safety-related)
  equipmentSafetyUptime: {
    formula: '(Total Hours - OOS Safety Hours) / Total Hours';
    overall: number;
    byEquipmentType: Record<EquipmentType, number>;
    byLocation: Record<string, number>;
  };
}
```

### J.2.2 Training Compliance

```typescript
interface TrainingKPIs {
  // Overall training compliance
  complianceRate: {
    formula: 'Employees Fully Trained / Total Employees';
    current: number;
    target: number;                    // e.g., 98%
    byLocation: Record<string, number>;
    byDepartment: Record<string, number>;
  };
  
  // Training completion metrics
  completionMetrics: {
    assignedTotal: number;
    completedOnTime: number;
    completedLate: number;
    overdue: number;
    overdueByDays: {
      '1-7': number;
      '8-14': number;
      '15-30': number;
      '30+': number;
    };
  };
  
  // Certification status
  certificationStatus: {
    currentCertifications: number;
    expiringIn30Days: number;
    expiringIn60Days: number;
    expiringIn90Days: number;
    expired: number;
  };
  
  // Training effectiveness (if tracked)
  quizPassRate: {
    overall: number;
    byCourse: Record<string, number>;
    firstAttemptPass: number;
  };
}
```

### J.2.3 Permit and JHA Metrics

```typescript
interface PermitJHAKPIs {
  // Permit usage
  permitMetrics: {
    permitsIssued: number;
    permitsByType: Record<PermitType, number>;
    avgApprovalTime: number;           // Minutes
    permitsExpiredBeforeClose: number;
    permitsSuspended: number;
  };
  
  // JHA coverage
  jhaMetrics: {
    activeJHAs: number;
    jhasCreatedThisPeriod: number;
    jhasReviewedThisPeriod: number;
    jhasExpired: number;
    tasksWithoutJHA: number;           // If tracked
  };
  
  // Risk trend
  riskTrend: {
    avgInitialRiskScore: number;
    avgResidualRiskScore: number;
    riskReductionPercentage: number;
  };
}
```

### J.2.4 Safety Observation Metrics

```typescript
interface ObservationKPIs {
  // Observation rate
  observationRate: {
    formula: 'Observations / Employee / Month';
    current: number;
    target: number;                    // e.g., 2 per employee
    byLocation: Record<string, number>;
  };
  
  // Safe vs at-risk ratio
  safetyRatio: {
    safeObservations: number;
    atRiskObservations: number;
    ratio: number;                     // Target > 5:1
    trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  };
  
  // Coaching completion
  coachingRate: {
    atRiskWithCoaching: number;
    totalAtRisk: number;
    percentage: number;
  };
  
  // Category breakdown
  byCategory: Record<ObservationCategory, {
    safe: number;
    atRisk: number;
    ratio: number;
  }>;
}
```

### J.2.5 CAPA Performance

```typescript
interface CAPAKPIs {
  // CAPA closure rate
  closureMetrics: {
    totalOpen: number;
    closedThisPeriod: number;
    avgDaysToClose: number;
    closedOnTime: number;
    closedLate: number;
    closureRate: number;               // Percentage on time
  };
  
  // Overdue CAPAs
  overdueMetrics: {
    total: number;
    byDaysOverdue: {
      '1-7': number;
      '8-14': number;
      '15-30': number;
      '30+': number;
    };
    byPriority: Record<Priority, number>;
    byOwner: Record<string, number>;   // Top 10 owners with overdue
  };
  
  // Verification effectiveness
  verificationMetrics: {
    verified: number;
    effective: number;
    partiallyEffective: number;
    notEffective: number;
    effectivenessRate: number;
  };
  
  // CAPA sources
  bySource: Record<CapaSourceType, number>;
}
```

### J.2.6 Stop Work Authority Usage

```typescript
interface SWAKPIs {
  // SWA usage rate
  usageRate: {
    totalEvents: number;
    byLocation: Record<string, number>;
    trend: TrendDirection;
  };
  
  // Resolution time
  resolutionTime: {
    avgMinutesToAcknowledge: number;
    avgMinutesToResolve: number;
    avgMinutesToResume: number;
  };
  
  // Outcome tracking
  outcomes: {
    hazardsMitigated: number;
    incidentsPrevented: number;        // Estimated
    falsePositives: number;            // Determined after review
  };
}
```

## J.3 Dashboard Specifications

### J.3.1 EHS Director Dashboard

```typescript
interface EHSDirectorDashboard {
  // Executive summary cards
  summaryCards: [
    { title: 'TRIR (YTD)', metric: 'trir.value', comparison: 'trir.benchmark.company', trend: true },
    { title: 'DART Rate', metric: 'dart.value', comparison: 'dart.benchmark.company', trend: true },
    { title: 'Days Since Recordable', metric: 'daysSinceLastRecordable', highlight: 'positive' },
    { title: 'Training Compliance', metric: 'training.complianceRate', target: 98, unit: '%' },
    { title: 'Open CAPAs', metric: 'capa.totalOpen', alert: 'if > 50' },
    { title: 'Overdue CAPAs', metric: 'capa.overdueMetrics.total', alert: 'if > 10' }
  ];
  
  // Charts
  charts: [
    {
      type: 'LINE',
      title: 'Incident Trend (12 Month)',
      series: ['Recordables', 'Near Misses', 'First Aid'],
      period: '12_MONTHS'
    },
    {
      type: 'BAR',
      title: 'Incidents by Location',
      dimension: 'location',
      metric: 'incidents.count'
    },
    {
      type: 'PIE',
      title: 'Incidents by Type',
      dimension: 'incidentType'
    },
    {
      type: 'HEATMAP',
      title: 'Risk Heatmap by Location/Category',
      dimensions: ['location', 'hazardCategory']
    }
  ];
  
  // Tables
  tables: [
    {
      title: 'Location Performance',
      columns: ['Location', 'TRIR', 'Training %', 'Inspection %', 'Open CAPAs'],
      sortable: true,
      exportable: true
    },
    {
      title: 'Critical Open Items',
      source: 'criticalOpenItems',
      limit: 10
    }
  ];
  
  // Alerts panel
  alerts: {
    source: 'criticalAlerts',
    categories: ['OVERDUE', 'ESCALATED', 'HIGH_RISK']
  };
}
```

### J.3.2 Branch Manager Dashboard

```typescript
interface BranchManagerDashboard {
  // Scope: Single location
  locationFilter: 'home_location';
  
  summaryCards: [
    { title: 'Days Incident Free', metric: 'daysSinceLastIncident', highlight: 'milestone_100' },
    { title: 'Training Compliance', metric: 'training.complianceRate', target: 98, unit: '%' },
    { title: 'Inspections Completed', metric: 'inspection.completionRate', target: 95, unit: '%' },
    { title: 'Open CAPAs', metric: 'capa.totalOpen', alert: 'if > 20' },
    { title: 'Equipment OOS', metric: 'equipment.outOfServiceCount', alert: 'if > 0' },
    { title: 'Active Permits', metric: 'permits.activeCount' }
  ];
  
  // Today view
  todayPanel: {
    inspectionsDueToday: InspectionSummary[];
    trainingDueToday: TrainingSummary[];
    permitsPendingApproval: PermitSummary[];
    overdueItems: OverdueItem[];
  };
  
  // My team section
  teamSection: {
    trainingStatus: EmployeeTrainingStatus[];
    certificationAlerts: CertificationAlert[];
  };
}
```

### J.3.3 Operations Manager Dashboard

```typescript
interface OpsManagerDashboard {
  // Focus: Production impact of safety
  
  summaryCards: [
    { title: 'Equipment Availability', metric: 'equipment.safetyUptime', target: 99, unit: '%' },
    { title: 'Active Permits', metric: 'permits.activeCount' },
    { title: 'Blocked Work Centers', metric: 'workCenters.blockedCount', alert: 'if > 0' },
    { title: 'Pending Inspections', metric: 'inspections.pendingCount' }
  ];
  
  // Equipment status
  equipmentPanel: {
    type: 'STATUS_BOARD',
    items: EquipmentAsset[],
    statusColors: {
      'SAFE': 'green',
      'REQUIRES_INSPECTION': 'yellow',
      'DEFECT_REPORTED': 'orange',
      'OUT_OF_SERVICE_SAFETY': 'red',
      'LOCKED_OUT': 'blue'
    }
  };
  
  // Active permits map
  activePermitsPanel: {
    type: 'LOCATION_MAP',
    items: Permit[],
    showValidUntil: true
  };
  
  // Production impact
  impactMetrics: {
    downtimeHoursSafety: number;       // This period
    jobsBlockedSafety: number;
    estimatedLostRevenue: number;
  };
}
```

### J.3.4 Supervisor Dashboard

```typescript
interface SupervisorDashboard {
  // Scope: Assigned work centers
  workCenterFilter: 'assigned_work_centers';
  
  // Action-oriented
  actionItems: {
    permitsPendingMyApproval: PermitSummary[];
    inspectionsDueToday: InspectionSummary[];
    overdueTrainingMyTeam: TrainingSummary[];
    openCapasMyTeam: CapaSummary[];
  };
  
  // My team status
  teamStatus: {
    employees: Array<{
      name: string;
      trainingCompliant: boolean;
      lastObservation: DateTime;
      activeCertifications: string[];
    }>;
  };
  
  // Work center status
  workCenterStatus: Array<{
    workCenterId: string;
    name: string;
    status: 'NORMAL' | 'PERMIT_ACTIVE' | 'BLOCKED';
    activePermits: number;
    equipmentOOS: number;
  }>;
}
```

## J.4 Report Templates

### J.4.1 OSHA 300 Log Generator

```typescript
interface Osha300LogReport {
  year: number;
  establishment: {
    name: string;
    streetAddress: string;
    city: string;
    state: string;
    zip: string;
    industry: string;
    naicsCode: string;
  };
  
  entries: Array<{
    caseNumber: string;
    employeeName: string;
    jobTitle: string;
    dateOfInjury: Date;
    whereOccurred: string;
    describeInjury: string;
    classifyCase: {
      death: boolean;
      daysAwayFromWork: boolean;
      jobTransferRestriction: boolean;
      otherRecordable: boolean;
    };
    daysAway: number;
    daysRestricted: number;
    injuryType: string;                // Code
    bodyPart: string;                  // Code
  }>;
  
  totals: {
    totalDeaths: number;
    totalDaysAway: number;
    totalDaysRestricted: number;
    totalOther: number;
    totalInjuries: number;
    totalSkinDisorders: number;
    totalRespiratoryConditions: number;
    totalPoisonings: number;
    totalHearingLoss: number;
    totalAllOther: number;
  };
  
  certification: {
    certifiedBy: string;
    title: string;
    phone: string;
    date: Date;
    signature: ElectronicSignature;
  };
}
```

### J.4.2 Monthly Safety Report

```typescript
interface MonthlySafetyReport {
  reportPeriod: { month: number; year: number };
  location: Location | 'ALL';
  
  sections: {
    executiveSummary: {
      keyMetrics: Array<{ name: string; value: number; trend: TrendDirection; vsLastMonth: number }>;
      highlights: string[];
      concerns: string[];
    };
    
    incidentSummary: {
      newIncidents: number;
      byType: Record<IncidentType, number>;
      bySeverity: Record<IncidentSeverity, number>;
      investigations: { started: number; completed: number; pending: number };
      notableIncidents: IncidentSummary[];
    };
    
    inspectionSummary: {
      scheduled: number;
      completed: number;
      completionRate: number;
      defectsFound: number;
      criticalDefects: number;
      defectsClosed: number;
    };
    
    trainingSummary: {
      coursesCompleted: number;
      employeesTrained: number;
      overdueAssignments: number;
      upcomingExpirations: number;
    };
    
    capaSummary: {
      newCapas: number;
      closedCapas: number;
      overdueCapas: number;
      avgDaysToClose: number;
    };
    
    permitActivity: {
      permitsIssued: number;
      byType: Record<PermitType, number>;
      incidents_during_permit: number;
    };
    
    observationSummary: {
      totalObservations: number;
      safeVsAtRisk: { safe: number; atRisk: number };
      topAtRiskCategories: Array<{ category: string; count: number }>;
    };
    
    upcomingFocus: string[];
    actionItems: Array<{ action: string; owner: string; dueDate: Date }>;
  };
}
```

### J.4.3 Audit-Ready Export

```typescript
interface AuditReadyExport {
  exportType: 'FULL' | 'INCIDENTS_ONLY' | 'TRAINING_ONLY' | 'INSPECTIONS_ONLY';
  dateRange: { start: Date; end: Date };
  locations: string[];
  
  format: 'PDF' | 'EXCEL' | 'CSV' | 'ZIP';
  
  includeAttachments: boolean;
  includeAuditTrail: boolean;
  includeSignatures: boolean;
  
  // Content sections
  contents: {
    incidents?: {
      list: Incident[];
      investigations: IncidentInvestigation[];
      capas: CorrectiveAction[];
    };
    training?: {
      courses: TrainingCourse[];
      completions: TrainingCompletion[];
      compliance: ComplianceReport[];
    };
    inspections?: {
      completed: Inspection[];
      defects: InspectionDefect[];
      templates: InspectionTemplate[];
    };
    permits?: {
      closed: Permit[];
      procedures: LotoProcedure[];
    };
    policies?: {
      current: PolicyDocument[];
      acknowledgements: PolicyAcknowledgement[];
    };
    audits?: {
      audits: Audit[];
      findings: AuditFinding[];
    };
  };
  
  // Metadata
  generatedAt: DateTime;
  generatedBy: User;
  hashManifest: Record<string, string>;   // File hashes for integrity
}
```

---

================================================================================
# K) TESTING PLAN
================================================================================

## K.1 Test Categories

### K.1.1 Unit Tests

| Module | Test Area | Coverage Target |
|--------|-----------|-----------------|
| Incident Service | TRIR/DART calculation | 100% |
| Incident Service | OSHA classification logic | 100% |
| Permit Service | Permit state transitions | 100% |
| Permit Service | Approval chain validation | 100% |
| Inspection Service | Defect severity rules | 100% |
| Training Service | Due date calculations | 100% |
| Training Service | Expiration logic | 100% |
| CAPA Service | Escalation timer logic | 100% |
| Audit Service | Hash chain calculation | 100% |
| Signature Service | Signature validation | 100% |

### K.1.2 Integration Tests

```typescript
describe('Incident Workflow Integration', () => {
  describe('Happy Path: Near Miss to Closure', () => {
    it('should create incident in DRAFT status', async () => {
      const incident = await incidentService.create({
        type: 'NEAR_MISS',
        locationId: 'loc_test',
        occurredAt: new Date(),
        description: 'Test near miss'
      });
      expect(incident.status).toBe('DRAFT');
    });
    
    it('should transition to SUBMITTED on submit', async () => {
      const incident = await incidentService.submit(incidentId, {
        immediateActions: 'Area secured',
        affectedPersonType: 'EMPLOYEE'
      });
      expect(incident.status).toBe('SUBMITTED');
      // Verify notifications sent
      expect(notificationService.send).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'INCIDENT_SUBMITTED' })
      );
    });
    
    it('should allow triage by EHS or Supervisor', async () => {
      const incident = await incidentService.triage(incidentId, {
        severity: 'NEAR_MISS',
        investigationRequired: false,
        oshaRecordable: false
      }, { userId: 'user_ehs' });
      expect(incident.status).toBe('TRIAGED');
    });
    
    it('should close directly when no investigation required', async () => {
      const incident = await incidentService.close(incidentId, {
        closureNotes: 'Near miss documented and shared in toolbox talk'
      });
      expect(incident.status).toBe('CLOSED');
    });
    
    it('should log all transitions to audit trail', async () => {
      const auditEvents = await auditService.getByResourceId(incidentId);
      expect(auditEvents.map(e => e.action)).toEqual([
        'CREATE', 'SUBMIT', 'UPDATE', 'CLOSE'
      ]);
    });
  });
  
  describe('Happy Path: Recordable Incident with Investigation', () => {
    it('should complete full workflow with investigation and CAPAs', async () => {
      // Create and submit
      const incident = await incidentService.create({
        type: 'INJURY',
        severity: 'MODERATE',
        // ... full incident data
      });
      await incidentService.submit(incidentId);
      
      // Triage as recordable
      await incidentService.triage(incidentId, {
        severity: 'MODERATE',
        investigationRequired: true,
        oshaRecordable: true,
        oshaClassification: 'RECORDABLE_OTHER'
      });
      expect(incident.status).toBe('TRIAGED');
      
      // Assign investigator
      await incidentService.assignInvestigator(incidentId, {
        leadInvestigatorId: 'user_ehs_specialist',
        dueDate: addDays(new Date(), 14)
      });
      expect(incident.status).toBe('INVESTIGATING');
      
      // Complete investigation with CAPAs
      await incidentService.completeInvestigation(incidentId, {
        rootCauseDescription: 'Inadequate training',
        findings: [{ category: 'TRAINING_GAP', description: '...' }],
        recommendations: ['Provide additional training'],
        capas: [{
          title: 'Provide refresher training',
          assignedToId: 'user_trainer',
          dueDate: addDays(new Date(), 7)
        }]
      });
      expect(incident.status).toBe('CAPA_ASSIGNED');
      
      // Complete CAPAs
      const capas = await capaService.getByIncidentId(incidentId);
      for (const capa of capas) {
        await capaService.implement(capa.id, { notes: 'Completed' });
        await capaService.verify(capa.id, { 
          result: 'EFFECTIVE',
          notes: 'Verified'
        });
      }
      
      // Incident should progress
      expect(incident.status).toBe('VERIFICATION');
      
      // Close incident
      await incidentService.close(incidentId, {
        closureNotes: 'All CAPAs effective'
      });
      expect(incident.status).toBe('CLOSED');
    });
  });
});
```

### K.1.3 Workflow Edge Cases

```typescript
describe('Incident Edge Cases', () => {
  describe('Missing Signoff', () => {
    it('should prevent submission without required attestation', async () => {
      await expect(
        incidentService.submit(incidentId, {
          immediateActions: 'Area secured',
          // Missing signature
        })
      ).rejects.toThrow('Electronic signature required');
    });
  });
  
  describe('Overdue Escalation', () => {
    it('should escalate investigation after due date', async () => {
      // Create incident with investigation due yesterday
      const incident = await createIncidentWithInvestigation({
        investigationDueDate: subDays(new Date(), 1)
      });
      
      // Run escalation job
      await escalationService.processOverdue();
      
      // Check escalation
      const updated = await incidentService.get(incident.id);
      expect(updated.investigation.escalationLevel).toBe(1);
      expect(notificationService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          recipients: { roles: ['EHS_MANAGER'] },
          type: 'INVESTIGATION_OVERDUE'
        })
      );
    });
  });
  
  describe('Reopen Closed Incident', () => {
    it('should only allow EHS Director to reopen', async () => {
      const closedIncident = await createClosedIncident();
      
      // EHS Specialist should not be able to reopen
      await expect(
        incidentService.reopen(closedIncident.id, {
          reason: 'New information'
        }, { userId: 'user_ehs_specialist' })
      ).rejects.toThrow('Insufficient permissions');
      
      // EHS Director should be able to reopen
      const reopened = await incidentService.reopen(closedIncident.id, {
        reason: 'New information received'
      }, { userId: 'user_ehs_director' });
      expect(reopened.status).toBe('REOPENED');
    });
  });
});

describe('Permit Edge Cases', () => {
  describe('Permit Expiration', () => {
    it('should auto-expire permit after validTo', async () => {
      // Create approved permit that expires in 1 hour
      const permit = await createApprovedPermit({
        validTo: addHours(new Date(), 1)
      });
      
      // Fast forward time
      jest.advanceTimersByTime(2 * 60 * 60 * 1000); // 2 hours
      
      // Run expiration job
      await permitService.processExpirations();
      
      // Check status
      const updated = await permitService.get(permit.id);
      expect(updated.status).toBe('EXPIRED');
      
      // Equipment should be flagged
      const equipment = await equipmentService.get(permit.equipmentAssetIds[0]);
      expect(equipment.safetyStatus).toBe('REQUIRES_INSPECTION');
    });
  });
  
  describe('Conflicting Permits', () => {
    it('should prevent overlapping LOTO permits on same equipment', async () => {
      // Create first LOTO permit
      const permit1 = await permitService.create({
        type: 'LOTO',
        equipmentAssetIds: ['equipment_1'],
        validFrom: new Date(),
        validTo: addHours(new Date(), 8)
      });
      await permitService.approve(permit1.id);
      
      // Attempt second LOTO on same equipment
      await expect(
        permitService.create({
          type: 'LOTO',
          equipmentAssetIds: ['equipment_1'],
          validFrom: addHours(new Date(), 2),
          validTo: addHours(new Date(), 10)
        })
      ).rejects.toThrow('Equipment already has active LOTO permit');
    });
  });
  
  describe('Lock Removal Sequence', () => {
    it('should require all workers to remove locks before closeout', async () => {
      const permit = await createActiveLotoPermit({
        workers: ['user_1', 'user_2', 'user_3']
      });
      
      // User 1 removes lock
      await permitService.removeLock(permit.id, {
        lockId: 'lock_1',
        userId: 'user_1'
      });
      
      // Attempt closeout should fail
      await expect(
        permitService.complete(permit.id)
      ).rejects.toThrow('All locks must be removed');
      
      // Remove remaining locks
      await permitService.removeLock(permit.id, { lockId: 'lock_2', userId: 'user_2' });
      await permitService.removeLock(permit.id, { lockId: 'lock_3', userId: 'user_3' });
      
      // Now closeout should work
      await permitService.complete(permit.id);
      expect(permit.status).toBe('COMPLETED');
    });
  });
});

describe('Training Blocking Operations', () => {
  describe('Expired Training Blocks Equipment Use', () => {
    it('should block forklift dispatch when certification expired', async () => {
      // User with expired forklift cert
      const user = await createUserWithExpiredCertification({
        courseId: 'TRN-FORKLIFT',
        expiredDaysAgo: 30
      });
      
      // Attempt to dispatch forklift to user
      const result = await dispatchService.assignEquipment({
        userId: user.id,
        equipmentId: 'forklift_1'
      });
      
      expect(result.blocked).toBe(true);
      expect(result.blockReason).toBe('TRAINING_EXPIRED');
      expect(result.requiredTraining).toContain('TRN-FORKLIFT');
    });
  });
});
```

## K.2 Authorization Tests

```typescript
describe('Safety RBAC Tests', () => {
  describe('Incident Permissions', () => {
    const testCases = [
      // [role, action, expectedResult]
      ['OPERATOR', 'incident.create', true],
      ['OPERATOR', 'incident.view_own', true],
      ['OPERATOR', 'incident.view_location', false],
      ['OPERATOR', 'incident.close', false],
      ['SUPERVISOR', 'incident.triage', true],
      ['SUPERVISOR', 'incident.close', false],
      ['EHS_SPECIALIST', 'incident.investigate', true],
      ['EHS_SPECIALIST', 'incident.close', false],
      ['EHS_MANAGER', 'incident.close', true],
      ['EHS_MANAGER', 'incident.reopen', false],
      ['EHS_DIRECTOR', 'incident.reopen', true],
    ];
    
    test.each(testCases)('%s should have %s = %s', async (role, action, expected) => {
      const user = await createUserWithRole(role);
      const hasPermission = await rbacService.check(user.id, action);
      expect(hasPermission).toBe(expected);
    });
  });
  
  describe('Permit Approval Chain', () => {
    it('should enforce multi-level approval for energized electrical', async () => {
      const permit = await createPermit({
        type: 'ELECTRICAL',
        electricalData: { workType: 'ENERGIZED' }
      });
      
      // First approval by EHS Manager
      await permitService.approve(permit.id, { userId: 'user_ehs_manager' });
      expect(permit.status).toBe('PENDING_APPROVAL'); // Still pending
      
      // Second approval by EHS Director
      await permitService.approve(permit.id, { userId: 'user_ehs_director' });
      expect(permit.status).toBe('APPROVED');
    });
  });
  
  describe('Data Scope Restrictions', () => {
    it('should only return location-scoped incidents for EHS Specialist', async () => {
      // Create incidents at two locations
      await createIncident({ locationId: 'loc_1' });
      await createIncident({ locationId: 'loc_2' });
      
      // EHS Specialist assigned to loc_1 only
      const user = await createUserWithLocationScope('EHS_SPECIALIST', ['loc_1']);
      
      const incidents = await incidentService.list({ userId: user.id });
      expect(incidents.every(i => i.locationId === 'loc_1')).toBe(true);
    });
  });
});
```

## K.3 Audit Integrity Tests

```typescript
describe('Audit Trail Integrity', () => {
  describe('Immutability', () => {
    it('should prevent modification of audit events', async () => {
      const event = await createAuditEvent();
      
      await expect(
        db.safetyAuditEvents.update({
          where: { id: event.id },
          data: { action: 'MODIFIED' }
        })
      ).rejects.toThrow('Audit events are immutable');
    });
    
    it('should prevent deletion of audit events', async () => {
      const event = await createAuditEvent();
      
      await expect(
        db.safetyAuditEvents.delete({ where: { id: event.id } })
      ).rejects.toThrow('Audit events are immutable');
    });
  });
  
  describe('Hash Chain Verification', () => {
    it('should maintain valid hash chain', async () => {
      // Create 100 audit events
      for (let i = 0; i < 100; i++) {
        await createAuditEvent({ action: `ACTION_${i}` });
      }
      
      // Verify chain
      const result = await auditService.verifyChainIntegrity(tenantId);
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });
    
    it('should detect tampering', async () => {
      // Create events
      for (let i = 0; i < 10; i++) {
        await createAuditEvent({ action: `ACTION_${i}` });
      }
      
      // Directly tamper with database (bypass app layer)
      await db.$executeRaw`
        UPDATE safety_audit_events 
        SET changes = '{"tampered": true}'::jsonb 
        WHERE sequence_number = 5
      `;
      
      // Verify should detect
      const result = await auditService.verifyChainIntegrity(tenantId);
      expect(result.valid).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({ type: 'HASH_MISMATCH', sequenceNumber: 5 })
      );
    });
  });
  
  describe('Signature Verification', () => {
    it('should validate signature integrity', async () => {
      const permit = await createAndApprovePermit();
      
      const signature = permit.signoffs[0].signature;
      const isValid = await signatureService.verify(signature);
      expect(isValid).toBe(true);
    });
  });
});
```

## K.4 Performance Tests

```typescript
describe('Performance Tests', () => {
  describe('Mobile Inspection Form', () => {
    it('should load inspection form in under 2 seconds on 3G', async () => {
      const start = performance.now();
      
      // Simulate 3G throttling
      await page.emulateNetworkConditions({
        offline: false,
        downloadThroughput: 750 * 1024 / 8,  // 750 kb/s
        uploadThroughput: 250 * 1024 / 8,    // 250 kb/s
        latency: 100
      });
      
      await page.goto('/safety/inspections/template/forklift-daily');
      await page.waitForSelector('[data-testid="inspection-form"]');
      
      const loadTime = performance.now() - start;
      expect(loadTime).toBeLessThan(2000);
    });
    
    it('should handle offline submission and sync', async () => {
      // Go offline
      await page.setOfflineMode(true);
      
      // Complete inspection
      await fillInspectionForm();
      await page.click('[data-testid="submit-inspection"]');
      
      // Should be queued
      const queue = await page.evaluate(() => localStorage.getItem('offlineQueue'));
      expect(JSON.parse(queue)).toHaveLength(1);
      
      // Go online
      await page.setOfflineMode(false);
      
      // Wait for sync
      await page.waitForSelector('[data-testid="sync-complete"]');
      
      // Verify submitted
      const inspection = await inspectionService.get(inspectionId);
      expect(inspection.status).toBe('PENDING_REVIEW');
    });
  });
  
  describe('Dashboard Load Time', () => {
    it('should load EHS Director dashboard in under 3 seconds', async () => {
      // With 10,000 incidents in database
      await seedDatabase({ incidents: 10000 });
      
      const start = performance.now();
      await page.goto('/safety/dashboard');
      await page.waitForSelector('[data-testid="dashboard-loaded"]');
      
      const loadTime = performance.now() - start;
      expect(loadTime).toBeLessThan(3000);
    });
  });
});
```

## K.5 Integration Tests with Operations

```typescript
describe('Safety-Operations Integration', () => {
  describe('Stop Work Blocks Dispatch', () => {
    it('should block job dispatch when stop work issued for work center', async () => {
      // Issue stop work
      const stopWork = await stopWorkService.issue({
        workCenterId: 'wc_saw_01',
        reason: 'Machine guarding issue',
        immediateDanger: true
      });
      
      // Attempt dispatch
      const dispatchResult = await dispatchService.dispatch({
        jobOrderId: 'job_123',
        workCenterId: 'wc_saw_01'
      });
      
      expect(dispatchResult.blocked).toBe(true);
      expect(dispatchResult.blockType).toBe('SAFETY_STOP_WORK');
      expect(dispatchResult.stopWorkId).toBe(stopWork.id);
    });
    
    it('should unblock dispatch when stop work resumed', async () => {
      // Create and resolve stop work
      const stopWork = await createAndResolveStopWork('wc_saw_01');
      
      // Dispatch should work now
      const dispatchResult = await dispatchService.dispatch({
        jobOrderId: 'job_123',
        workCenterId: 'wc_saw_01'
      });
      
      expect(dispatchResult.blocked).toBe(false);
    });
  });
  
  describe('Equipment Safety Status', () => {
    it('should prevent equipment use when out of service for safety', async () => {
      // Mark equipment out of service
      await equipmentService.updateSafetyStatus('forklift_1', {
        status: 'OUT_OF_SERVICE_SAFETY',
        reason: 'Brake failure',
        inspectionDefectId: 'defect_123'
      });
      
      // Attempt to assign equipment
      const result = await dispatchService.assignEquipment({
        equipmentId: 'forklift_1',
        userId: 'user_operator'
      });
      
      expect(result.blocked).toBe(true);
      expect(result.blockReason).toBe('EQUIPMENT_OUT_OF_SERVICE_SAFETY');
    });
  });
});
```

---

================================================================================
# L) ROLLOUT PLAN + GO/NO-GO
================================================================================

## L.1 Rollout Phases

### L.1.1 Phase 0: Pre-Rollout (Weeks 1-2)

| Task | Owner | Duration | Deliverable |
|------|-------|----------|-------------|
| Environment setup | DevOps | 2 days | Staging environment |
| Data model migration | Dev | 3 days | Schema deployed |
| API deployment | Dev | 2 days | APIs functional |
| UI deployment | Dev | 2 days | UI accessible |
| Initial configuration | EHS Lead | 2 days | Tenant config |
| Test data seeding | QA | 1 day | Test data loaded |
| Admin training | Training | 2 days | EHS admins trained |

### L.1.2 Phase 1: Pilot Branch (Weeks 3-4)

**Pilot Location Selection Criteria:**
- Medium-sized branch (50-100 employees)
- Engaged Branch Manager and Supervisor team
- Mix of equipment types (forklifts, saws, cranes)
- Existing safety program maturity (not newest, not oldest)
- Good internet connectivity

**Pilot Scope:**
| Module | Included | Notes |
|--------|----------|-------|
| Incident Reporting | ✓ | All incident types |
| Near Miss Reporting | ✓ | Encourage reporting |
| Inspections (Forklift Daily) | ✓ | Replace paper forms |
| Inspections (Other) | Limited | 2-3 additional types |
| LOTO Permits | ✓ | Full implementation |
| Hot Work Permits | ✓ | Full implementation |
| Training Dashboard | ✓ | View existing records |
| Training Assignments | Limited | 5 courses max |
| Policy Acknowledgements | Limited | 3 policies max |
| CAPAs | ✓ | From inspections/incidents |
| SDS Library | ✓ | View only initially |
| Safety Observations | ✓ | Simple implementation |
| Audits | ○ | Not in pilot |
| AI Assistant | Limited | KB queries only |

**Pilot Activities:**

| Day | Activity | Participants |
|-----|----------|--------------|
| 1 | Kickoff meeting | All pilot employees |
| 1-2 | Kiosk setup and testing | IT + EHS |
| 2-3 | Forklift operator training | All forklift operators |
| 3-5 | Supervisor training | Supervisors, leads |
| 6-10 | Parallel run (paper + digital) | All |
| 11-14 | Digital only | All |
| 15-20 | Monitor and adjust | EHS |
| 21 | Pilot review | Leadership |

### L.1.3 Phase 2: Expansion (Weeks 5-8)

**Week 5-6: Second Wave (3 Additional Branches)**
- Deploy to similar-profile branches
- Include all pilot modules
- Train-the-trainer model
- Pilot location EHS supports new locations

**Week 7-8: Third Wave (Remaining Branches)**
- Deploy to all remaining locations
- Staggered by 2-3 locations per day
- Regional EHS coordinates
- Support escalation path defined

### L.1.4 Phase 3: Full Feature Rollout (Weeks 9-12)

| Week | Features Added |
|------|----------------|
| 9 | All inspection types activated |
| 9 | All permit types activated |
| 10 | Full training module (all courses) |
| 10 | All policy acknowledgements |
| 11 | Audit module |
| 11 | Full AI Assistant (all tools) |
| 12 | Advanced KPIs and reports |
| 12 | Integration with HR/Payroll (hours worked) |

## L.2 Data Migration and Seeding

### L.2.1 Initial Data Requirements

| Data Type | Source | Migration Method | Timeline |
|-----------|--------|------------------|----------|
| Employees | HR System | API Integration | Day 1 |
| Locations | ERP | API Integration | Day 1 |
| Work Centers | ERP | API Integration | Day 1 |
| Equipment | CMMS/Asset System | Import + Manual | Week 1 |
| Training Courses | Training Dept | Manual entry | Week 1 |
| Training Records | LMS | Import file | Week 1-2 |
| Policies | Document Management | Manual upload | Week 1-2 |
| LOTO Procedures | Paper/Word | Manual entry | Week 2-3 |
| SDS Records | Existing SDS system | Import | Week 2 |
| Inspection Templates | Paper checklists | Manual creation | Week 2 |
| PPE Matrix | Paper/Excel | Manual entry | Week 2 |
| Historical Incidents | Paper/Spreadsheet | Import (optional) | Week 3 |

### L.2.2 RAG Knowledge Base Ingestion

| Content Type | Source | Ingestion Method | Timeline |
|--------------|--------|------------------|----------|
| OSHA Standards | OSHA website/PDF | Structured parsing | Week 1 |
| NFPA 70E | NFPA document | Structured parsing | Week 1 |
| ANSI Standards | Standard PDFs | Structured parsing | Week 1 |
| Company Policies | Policy documents | Document upload | Week 2 |
| LOTO Procedures | Procedure documents | Document upload | Week 2-3 |
| JHAs | JHA documents | Document upload | Week 2-3 |
| Training Materials | Training PDFs | Document upload | Week 3 |
| Incident Learnings | Historical analysis | Manual curation | Week 3-4 |
| SDS Guidance | SDS PDFs | Automated extraction | Week 2 |

### L.2.3 Seeding Script Example

```typescript
async function seedSafetyModule(tenantId: string): Promise<SeedResult> {
  const results = { policies: 0, courses: 0, templates: 0, procedures: 0 };
  
  // 1. Seed default policies
  const defaultPolicies = [
    {
      code: 'EHS-LOTO-001',
      title: 'Lockout/Tagout Program',
      type: 'LOTO_PROGRAM',
      contentUrl: await uploadDefaultPolicy('loto-program.pdf')
    },
    {
      code: 'EHS-HOT-001',
      title: 'Hot Work Safety Program',
      type: 'HOT_WORK',
      contentUrl: await uploadDefaultPolicy('hot-work-program.pdf')
    },
    // ... additional policies
  ];
  
  for (const policy of defaultPolicies) {
    await policyService.create({ ...policy, tenantId, status: 'PUBLISHED' });
    results.policies++;
  }
  
  // 2. Seed training courses
  const defaultCourses = [
    {
      code: 'TRN-LOTO-AUTH',
      title: 'LOTO Authorized Employee Training',
      category: 'LOTO',
      validityMonths: 12,
      requiredForRoles: ['MAINTENANCE_TECH', 'MAINTENANCE_LEAD', 'OPERATOR']
    },
    {
      code: 'TRN-FORKLIFT',
      title: 'Powered Industrial Truck Operator',
      category: 'FORKLIFT',
      validityMonths: 36,
      requiredForRoles: ['FORKLIFT_OPERATOR']
    },
    // ... additional courses
  ];
  
  for (const course of defaultCourses) {
    await trainingService.createCourse({ ...course, tenantId });
    results.courses++;
  }
  
  // 3. Seed inspection templates
  const defaultTemplates = [
    {
      code: 'INS-FORKLIFT-DAILY',
      name: 'Forklift Pre-Shift Inspection',
      type: 'FORKLIFT_DAILY',
      frequency: 'DAILY',
      sections: forkliftDailySections
    },
    {
      code: 'INS-CRANE-MONTHLY',
      name: 'Overhead Crane Monthly Inspection',
      type: 'CRANE_MONTHLY',
      frequency: 'MONTHLY',
      sections: craneMonthlySections
    },
    // ... additional templates
  ];
  
  for (const template of defaultTemplates) {
    await inspectionService.createTemplate({ ...template, tenantId });
    results.templates++;
  }
  
  // 4. Seed PPE matrix
  await ppeMatrixService.create({
    tenantId,
    name: 'Standard PPE Matrix',
    entries: defaultPPEMatrix
  });
  
  return results;
}
```

## L.3 Training Plan

### L.3.1 Training Matrix

| Audience | Training | Duration | Method | Timing |
|----------|----------|----------|--------|--------|
| EHS Director | System Overview + Admin | 2 hours | Live + Hands-on | Week 1 |
| EHS Manager | Full System Training | 4 hours | Live + Hands-on | Week 1 |
| EHS Specialist | Full System + Data Entry | 6 hours | Live + Hands-on | Week 1-2 |
| Branch Manager | Dashboard + Approvals | 2 hours | Live + Self-paced | Week 2-3 |
| Supervisors | Approvals + Oversight | 3 hours | Live + Hands-on | Week 3 |
| Operators | Mobile/Kiosk Usage | 1 hour | Hands-on + Video | Week 3-4 |
| Maintenance | LOTO Permits + Equipment | 2 hours | Hands-on | Week 3-4 |
| Contractors | Portal Access | 30 min | Self-paced | As needed |

### L.3.2 Train-the-Trainer Approach

1. **Core Trainers** (Week 1-2)
   - 2-3 EHS specialists per region
   - Full system certification
   - Train all modules

2. **Site Trainers** (Week 2-3)
   - Branch-level EHS or safety point-person
   - Operator and inspection training focus
   - Supported by core trainers

3. **Just-in-Time Support**
   - In-app help and tooltips
   - Quick reference cards at kiosks
   - Video tutorials for common tasks
   - Hotline support during rollout

## L.4 Go/No-Go Criteria

### L.4.1 Technical Go/No-Go

| Criterion | Requirement | Measurement | Go Threshold |
|-----------|-------------|-------------|--------------|
| System Availability | Uptime during business hours | Monitoring | > 99.5% |
| API Response Time | Average response time | APM | < 500ms |
| Mobile Form Load | Form load on 4G | Performance test | < 2 seconds |
| Offline Capability | Forms work offline | Functional test | Pass all tests |
| Data Integrity | Audit chain valid | Integrity check | 100% valid |
| Security Scan | Vulnerability scan | Security tool | No high/critical |
| Integration Tests | All integration tests | Test suite | 100% pass |
| Load Test | 500 concurrent users | Load test | < 2s response |

### L.4.2 Functional Go/No-Go

| Criterion | Requirement | Measurement | Go Threshold |
|-----------|-------------|-------------|--------------|
| Incident Workflow | Full workflow functional | E2E test | Pass |
| Permit Workflow | All permit types work | E2E test | Pass |
| Inspection Workflow | Complete and submit | E2E test | Pass |
| Training Tracking | Assignments and completions | E2E test | Pass |
| RBAC | All roles tested | Authorization test | Pass |
| Signatures | E-signatures captured | Functional test | Pass |
| Notifications | Emails/push delivered | Delivery test | > 95% |
| Reports | All reports generate | Report test | Pass |

### L.4.3 Operational Go/No-Go

| Criterion | Requirement | Measurement | Go Threshold |
|-----------|-------------|-------------|--------------|
| Admin Training | EHS admins trained | Completion | 100% |
| Support Ready | Help desk trained | Certification | Complete |
| Documentation | User guides available | Content review | Complete |
| Rollback Plan | Rollback tested | Runbook | Verified |
| Data Migration | Critical data loaded | Data validation | 100% |
| Backup/Recovery | Backup verified | Recovery test | Pass |

### L.4.4 Pilot Go/No-Go (End of Phase 1)

| Criterion | Requirement | Measurement | Go Threshold |
|-----------|-------------|-------------|--------------|
| User Adoption | Daily active users | Analytics | > 80% of target |
| Incident Reporting | Incidents reported in system | Count | > 90% captured |
| Inspection Completion | Daily forklift inspections | Completion rate | > 90% |
| User Satisfaction | Survey score | Survey | > 3.5/5 |
| Critical Issues | Blocking bugs | Bug tracking | 0 open |
| High Issues | Major bugs | Bug tracking | < 5 open |
| EHS Approval | EHS lead sign-off | Approval | Approved |
| Ops Approval | Ops manager sign-off | Approval | Approved |

## L.5 Risk Mitigation

### L.5.1 Identified Risks

| Risk | Probability | Impact | Mitigation | Contingency |
|------|-------------|--------|------------|-------------|
| User resistance | Medium | High | Change management, training, quick wins | Extended parallel run |
| Connectivity issues | Low | Medium | Offline capability | Paper backup forms |
| Data migration errors | Medium | High | Validation scripts, parallel verification | Manual correction |
| Integration failures | Low | Medium | Staged integration, fallback | Manual data entry |
| Performance issues | Low | High | Load testing, scaling plan | Scale up resources |
| Security incident | Very Low | Very High | Security audit, monitoring | Incident response plan |

### L.5.2 Rollback Plan

```typescript
interface RollbackPlan {
  triggers: [
    'System availability < 95% for > 1 hour',
    'Data integrity issue detected',
    'Security breach confirmed',
    'Critical workflow blocked',
    'EHS Director decision'
  ];
  
  procedure: {
    step1: 'Notify all stakeholders',
    step2: 'Disable new data entry (read-only mode)',
    step3: 'Export any data entered since go-live',
    step4: 'Revert to paper processes',
    step5: 'Conduct root cause analysis',
    step6: 'Define fix and re-rollout plan',
    step7: 'Re-import data when resolved'
  };
  
  paperBackup: {
    formsLocation: 'Shared drive: /Safety/Paper_Backup/',
    distributionPlan: 'EHS coordinators distribute within 2 hours',
    dataEntry: 'Backlog entered once system restored'
  };
}
```

## L.6 Success Metrics (Post-Rollout)

### L.6.1 30-Day Metrics

| Metric | Target | Actual |
|--------|--------|--------|
| System uptime | > 99.5% | |
| Daily active users | > 85% of target | |
| Incidents reported digitally | > 95% | |
| Daily inspections completed | > 95% | |
| Permits issued digitally | > 90% | |
| Support tickets (critical) | < 5 | |
| User satisfaction score | > 4.0/5 | |

### L.6.2 90-Day Metrics

| Metric | Target | Actual |
|--------|--------|--------|
| Near-miss reporting rate | +25% vs baseline | |
| Inspection defect discovery | +15% vs baseline | |
| Training compliance | > 95% | |
| CAPA on-time closure | > 85% | |
| Safety observation rate | > 1 per employee | |
| Paper form elimination | > 95% | |
| Time to complete inspection | -30% vs paper | |

### L.6.3 1-Year Metrics

| Metric | Target | Notes |
|--------|--------|-------|
| TRIR improvement | -10% vs prior year | Lagging indicator |
| Near-miss to incident ratio | > 10:1 | Leading indicator |
| Training compliance | > 98% | Sustained |
| Inspection compliance | > 98% | Sustained |
| Audit findings reduction | -20% | Compliance improvement |
| Cost avoidance (estimated) | Document | WC, fines, efficiency |

---

## L.7 Summary Checklist

### Pre-Go-Live Checklist

- [ ] All technical go/no-go criteria met
- [ ] All functional go/no-go criteria met
- [ ] All operational go/no-go criteria met
- [ ] EHS Director approval obtained
- [ ] IT approval obtained
- [ ] Legal/Compliance review complete
- [ ] Rollback plan tested and documented
- [ ] Support team trained and ready
- [ ] Communication plan executed
- [ ] Pilot location fully prepared
- [ ] Data migration validated
- [ ] RAG knowledge base loaded
- [ ] Integration points verified
- [ ] Performance benchmarks met
- [ ] Security scan passed

### Go-Live Day Checklist

- [ ] War room established
- [ ] All support channels monitored
- [ ] EHS team on standby
- [ ] Executive stakeholders notified
- [ ] System monitoring active
- [ ] First transactions verified
- [ ] User feedback collection active
- [ ] Hourly status updates planned

---

**Document Control:**
- Version: 1.0.0
- Status: Implementation-Ready
- Last Updated: 2026-02-03
- Next Review: After Pilot Phase

**Approval Signatures:**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| EHS Director | | | |
| IT Director | | | |
| Operations VP | | | |
| Project Sponsor | | | |

---

*End of Safety Module Specification*
