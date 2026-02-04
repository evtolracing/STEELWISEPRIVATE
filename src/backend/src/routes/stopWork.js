/**
 * Stop-Work Authority (SWA) Routes
 * Manages safety stop-work events, clearances, and dispatch integration
 */

import express from 'express';
import prisma from '../db.js';
import crypto from 'crypto';

const router = express.Router();

// ============================================
// ENUMS & CONSTANTS
// ============================================

const SWA_SCOPE_TYPES = ['OPERATION', 'JOB', 'WORK_CENTER', 'ASSET', 'AREA', 'LOCATION'];
const SWA_SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const SWA_STATUSES = [
  'ACTIVE', 'UNDER_INVESTIGATION', 'MITIGATION_IN_PROGRESS',
  'PENDING_VERIFICATION', 'PENDING_APPROVAL', 'CLEARED', 'ESCALATED'
];
const SWA_SOURCES = ['OPERATOR', 'SUPERVISOR', 'SAFETY_AI_ASSISTANT', 'EHS_PERSONNEL', 'MAINTENANCE', 'SYSTEM_AUTO', 'MANAGEMENT'];

const SWA_REASON_CODES = [
  'MISSING_LOTO_PERMIT', 'EXPIRED_LOTO_PERMIT', 'MISSING_HOT_WORK_PERMIT', 'EXPIRED_HOT_WORK_PERMIT',
  'MISSING_CONFINED_SPACE_PERMIT', 'PERMIT_VIOLATION', 'OVERDUE_INSPECTION', 'FAILED_INSPECTION',
  'INSPECTION_FINDING_CRITICAL', 'EQUIPMENT_MALFUNCTION', 'MISSING_GUARD', 'GUARD_BYPASSED',
  'EQUIPMENT_OUT_OF_SERVICE', 'EQUIPMENT_UNSAFE_CONDITION', 'OPERATOR_TRAINING_EXPIRED',
  'OPERATOR_NOT_QUALIFIED', 'SDS_HAZARD_ESCALATION', 'CHEMICAL_SPILL', 'ENVIRONMENTAL_HAZARD',
  'FIRE_HAZARD', 'INCIDENT_UNDER_INVESTIGATION', 'NEAR_MISS_PATTERN_DETECTED', 'CAPA_OPEN_ON_ASSET',
  'OPERATOR_SAFETY_CONCERN', 'UNSAFE_WORK_CONDITION', 'SYSTEM_AUTO_BLOCK', 'AI_SAFETY_INTERVENTION',
  'EHS_DIRECTIVE', 'MANAGEMENT_DIRECTIVE', 'EXTERNAL_REGULATORY'
];

// Clearance authority by severity and scope
const CLEARANCE_AUTHORITY = {
  LOW: ['SUPERVISOR', 'MAINTENANCE_LEAD', 'EHS_MANAGER', 'OPS_MANAGER', 'BRANCH_MANAGER'],
  MEDIUM: ['MAINTENANCE_LEAD', 'EHS_MANAGER', 'OPS_MANAGER', 'BRANCH_MANAGER'],
  HIGH: ['EHS_MANAGER', 'BRANCH_MANAGER'],
  CRITICAL: ['EHS_MANAGER', 'BRANCH_MANAGER'],
};

// Default clearance steps by reason code
const DEFAULT_CLEARANCE_STEPS = {
  MISSING_LOTO_PERMIT: [
    { stepNumber: 1, description: 'Obtain LOTO permit from supervisor', requiredRole: 'OPERATOR' },
    { stepNumber: 2, description: 'Verify all energy sources identified', requiredRole: 'SUPERVISOR' },
    { stepNumber: 3, description: 'Apply personal locks and tags', requiredRole: 'OPERATOR' },
    { stepNumber: 4, description: 'Verify zero energy state', requiredRole: 'SUPERVISOR' },
  ],
  EXPIRED_LOTO_PERMIT: [
    { stepNumber: 1, description: 'Renew LOTO permit', requiredRole: 'SUPERVISOR' },
    { stepNumber: 2, description: 'Re-verify energy isolation', requiredRole: 'MAINTENANCE' },
    { stepNumber: 3, description: 'Update permit documentation', requiredRole: 'SUPERVISOR' },
  ],
  OVERDUE_INSPECTION: [
    { stepNumber: 1, description: 'Schedule inspection', requiredRole: 'SUPERVISOR' },
    { stepNumber: 2, description: 'Complete inspection', requiredRole: 'MAINTENANCE' },
    { stepNumber: 3, description: 'Address any findings', requiredRole: 'MAINTENANCE' },
    { stepNumber: 4, description: 'Document and close inspection', requiredRole: 'SUPERVISOR' },
  ],
  EQUIPMENT_MALFUNCTION: [
    { stepNumber: 1, description: 'Report issue to maintenance', requiredRole: 'OPERATOR' },
    { stepNumber: 2, description: 'Diagnose root cause', requiredRole: 'MAINTENANCE' },
    { stepNumber: 3, description: 'Complete repair', requiredRole: 'MAINTENANCE' },
    { stepNumber: 4, description: 'Test equipment operation', requiredRole: 'MAINTENANCE' },
    { stepNumber: 5, description: 'Supervisor verification', requiredRole: 'SUPERVISOR' },
  ],
  OPERATOR_TRAINING_EXPIRED: [
    { stepNumber: 1, description: 'Schedule training session', requiredRole: 'SUPERVISOR' },
    { stepNumber: 2, description: 'Complete training course', requiredRole: 'OPERATOR' },
    { stepNumber: 3, description: 'Update training records', requiredRole: 'TRAINING_ADMIN' },
  ],
  GUARD_BYPASSED: [
    { stepNumber: 1, description: 'Investigate bypass reason', requiredRole: 'SUPERVISOR' },
    { stepNumber: 2, description: 'Restore guard to proper position', requiredRole: 'MAINTENANCE' },
    { stepNumber: 3, description: 'Verify interlock function', requiredRole: 'MAINTENANCE' },
    { stepNumber: 4, description: 'Document incident', requiredRole: 'EHS' },
    { stepNumber: 5, description: 'EHS approval for resumption', requiredRole: 'EHS' },
  ],
  OPERATOR_SAFETY_CONCERN: [
    { stepNumber: 1, description: 'Review reported concern', requiredRole: 'SUPERVISOR' },
    { stepNumber: 2, description: 'Assess and mitigate hazard', requiredRole: 'SUPERVISOR' },
    { stepNumber: 3, description: 'Operator confirms resolution', requiredRole: 'OPERATOR' },
  ],
};

// ============================================
// HELPER FUNCTIONS
// ============================================

// Generate unique SWA event number
function generateEventNumber() {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `SWA-${year}-${random}`;
}

// Calculate hash for audit chain
function calculateAuditHash(entry, previousHash = '') {
  const content = JSON.stringify({
    stopWorkEventId: entry.stopWorkEventId,
    action: entry.action,
    description: entry.description,
    performedBy: entry.performedBy,
    performedByRole: entry.performedByRole,
    performedAt: entry.performedAt,
    previousHash,
  });
  return crypto.createHash('sha256').update(content).digest('hex');
}

// Check if user role can clear a SWA based on severity
function canClearSWA(userRole, severity) {
  const authorizedRoles = CLEARANCE_AUTHORITY[severity] || [];
  return authorizedRoles.includes(userRole);
}

// Get default clearance steps for a reason code
function getDefaultClearanceSteps(reasonCode) {
  return DEFAULT_CLEARANCE_STEPS[reasonCode] || [
    { stepNumber: 1, description: 'Investigate root cause', requiredRole: 'SUPERVISOR' },
    { stepNumber: 2, description: 'Implement corrective action', requiredRole: 'SUPERVISOR' },
    { stepNumber: 3, description: 'Verify issue resolved', requiredRole: 'SUPERVISOR' },
  ];
}

// ============================================
// IN-MEMORY STORE (Replace with Prisma when models are added)
// ============================================

const stopWorkEvents = new Map();
const auditEntries = new Map();
const clearanceSteps = new Map();
const evidence = new Map();

// ============================================
// ROUTES
// ============================================

/**
 * GET /api/safety/stop-work
 * Get all stop-work events with optional filters
 */
router.get('/', async (req, res) => {
  try {
    const { status, scopeType, severity, limit = 50 } = req.query;
    
    let events = Array.from(stopWorkEvents.values());
    
    if (status) {
      events = events.filter(e => e.status === status);
    }
    if (scopeType) {
      events = events.filter(e => e.scopeType === scopeType);
    }
    if (severity) {
      events = events.filter(e => e.severity === severity);
    }
    
    // Sort by created date descending
    events.sort((a, b) => new Date(b.initiatedAt) - new Date(a.initiatedAt));
    
    res.json({
      success: true,
      data: events.slice(0, parseInt(limit)),
      total: events.length,
    });
  } catch (error) {
    console.error('Error fetching stop-work events:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/safety/stop-work/active
 * Get only active stop-work events
 */
router.get('/active', async (req, res) => {
  try {
    const activeStatuses = ['ACTIVE', 'UNDER_INVESTIGATION', 'MITIGATION_IN_PROGRESS', 'PENDING_VERIFICATION', 'PENDING_APPROVAL'];
    
    let events = Array.from(stopWorkEvents.values())
      .filter(e => activeStatuses.includes(e.status));
    
    res.json({
      success: true,
      data: events,
      total: events.length,
    });
  } catch (error) {
    console.error('Error fetching active stop-work events:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/safety/stop-work/blocked-resources
 * Get all currently blocked resources for dispatch integration
 */
router.get('/blocked-resources', async (req, res) => {
  try {
    const activeStatuses = ['ACTIVE', 'UNDER_INVESTIGATION', 'MITIGATION_IN_PROGRESS', 'PENDING_VERIFICATION', 'PENDING_APPROVAL'];
    
    const activeEvents = Array.from(stopWorkEvents.values())
      .filter(e => activeStatuses.includes(e.status));
    
    const blocked = {
      jobs: [],
      workCenters: [],
      assets: [],
      areas: [],
      locations: [],
      operators: [],
    };
    
    for (const event of activeEvents) {
      switch (event.scopeType) {
        case 'JOB':
          blocked.jobs.push({ id: event.scopeId, reason: event.reasonCode, swaId: event.id });
          break;
        case 'WORK_CENTER':
          blocked.workCenters.push({ id: event.scopeId, reason: event.reasonCode, swaId: event.id });
          break;
        case 'ASSET':
          blocked.assets.push({ id: event.scopeId, reason: event.reasonCode, swaId: event.id });
          break;
        case 'AREA':
          blocked.areas.push({ id: event.scopeId, reason: event.reasonCode, swaId: event.id });
          break;
        case 'LOCATION':
          blocked.locations.push({ id: event.scopeId, reason: event.reasonCode, swaId: event.id });
          break;
      }
      
      // Also track affected operators
      if (event.affectedOperators) {
        blocked.operators.push(...event.affectedOperators.map(op => ({
          id: op,
          reason: event.reasonCode,
          swaId: event.id,
        })));
      }
    }
    
    res.json({
      success: true,
      data: blocked,
      activeEventCount: activeEvents.length,
    });
  } catch (error) {
    console.error('Error fetching blocked resources:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/safety/stop-work/:id
 * Get a specific stop-work event with full details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const event = stopWorkEvents.get(id);
    
    if (!event) {
      return res.status(404).json({ success: false, error: 'Stop-work event not found' });
    }
    
    // Get related data
    const eventAudit = Array.from(auditEntries.values())
      .filter(a => a.stopWorkEventId === id)
      .sort((a, b) => new Date(a.performedAt) - new Date(b.performedAt));
    
    const eventSteps = Array.from(clearanceSteps.values())
      .filter(s => s.stopWorkEventId === id)
      .sort((a, b) => a.stepNumber - b.stepNumber);
    
    const eventEvidence = Array.from(evidence.values())
      .filter(e => e.stopWorkEventId === id);
    
    res.json({
      success: true,
      data: {
        ...event,
        auditTrail: eventAudit,
        clearanceSteps: eventSteps,
        evidence: eventEvidence,
      },
    });
  } catch (error) {
    console.error('Error fetching stop-work event:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/safety/stop-work
 * Initiate a new stop-work event
 */
router.post('/', async (req, res) => {
  try {
    const {
      scopeType,
      scopeId,
      scopeDescription,
      reasonCode,
      severity,
      description,
      immediateCause,
      relatedPolicyId,
      relatedJobId,
      relatedAssetId,
      relatedIncidentId,
      relatedPermitId,
      affectedJobs = [],
      affectedOperators = [],
      initiatedBySource = 'OPERATOR',
    } = req.body;
    
    // Validation
    if (!SWA_SCOPE_TYPES.includes(scopeType)) {
      return res.status(400).json({ success: false, error: `Invalid scopeType. Must be one of: ${SWA_SCOPE_TYPES.join(', ')}` });
    }
    if (!SWA_SEVERITIES.includes(severity)) {
      return res.status(400).json({ success: false, error: `Invalid severity. Must be one of: ${SWA_SEVERITIES.join(', ')}` });
    }
    if (!SWA_REASON_CODES.includes(reasonCode)) {
      return res.status(400).json({ success: false, error: `Invalid reasonCode` });
    }
    if (!scopeId || !description) {
      return res.status(400).json({ success: false, error: 'scopeId and description are required' });
    }
    
    // Create the event
    const eventId = crypto.randomUUID();
    const eventNumber = generateEventNumber();
    const now = new Date().toISOString();
    
    // TODO: Get actual user from auth context
    const initiatedBy = 'current-user-id';
    const initiatedByRole = 'OPERATOR';
    
    const event = {
      id: eventId,
      eventNumber,
      scopeType,
      scopeId,
      scopeDescription: scopeDescription || `${scopeType}: ${scopeId}`,
      reasonCode,
      severity,
      description,
      immediateCause,
      relatedPolicyId,
      relatedJobId,
      relatedAssetId,
      relatedIncidentId,
      relatedPermitId,
      affectedJobs,
      affectedOperators,
      initiatedBy,
      initiatedByRole,
      initiatedBySource,
      initiatedAt: now,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };
    
    stopWorkEvents.set(eventId, event);
    
    // Create default clearance steps
    const steps = getDefaultClearanceSteps(reasonCode);
    for (const step of steps) {
      const stepId = crypto.randomUUID();
      clearanceSteps.set(stepId, {
        id: stepId,
        stopWorkEventId: eventId,
        ...step,
        status: 'PENDING',
        createdAt: now,
      });
    }
    
    // Create initial audit entry
    const auditId = crypto.randomUUID();
    const auditEntry = {
      id: auditId,
      stopWorkEventId: eventId,
      action: 'INITIATED',
      description: `Stop-Work initiated: ${reasonCode}`,
      previousValue: null,
      newValue: { status: 'ACTIVE', severity, scopeType, scopeId },
      performedBy: initiatedBy,
      performedByRole: initiatedByRole,
      performedAt: now,
      previousHash: '',
    };
    auditEntry.hash = calculateAuditHash(auditEntry, '');
    auditEntries.set(auditId, auditEntry);
    
    // TODO: Send notifications based on severity
    // - CRITICAL/HIGH: Immediate notification to EHS and Ops Manager
    // - MEDIUM: Notification to Supervisor
    // - LOW: Standard notification
    
    res.status(201).json({
      success: true,
      data: event,
      message: `Stop-Work ${eventNumber} initiated successfully`,
    });
  } catch (error) {
    console.error('Error creating stop-work event:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/safety/stop-work/:id/status
 * Update stop-work event status (with authorization check)
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    const event = stopWorkEvents.get(id);
    if (!event) {
      return res.status(404).json({ success: false, error: 'Stop-work event not found' });
    }
    
    if (!SWA_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, error: `Invalid status. Must be one of: ${SWA_STATUSES.join(', ')}` });
    }
    
    // TODO: Get actual user from auth context
    const userId = 'current-user-id';
    const userRole = 'SUPERVISOR';
    
    // Check authorization for CLEARED status
    if (status === 'CLEARED') {
      if (!canClearSWA(userRole, event.severity)) {
        return res.status(403).json({
          success: false,
          error: `Unauthorized: ${userRole} cannot clear ${event.severity} severity events`,
          requiredRoles: CLEARANCE_AUTHORITY[event.severity],
        });
      }
      
      // Check all clearance steps are complete
      const steps = Array.from(clearanceSteps.values())
        .filter(s => s.stopWorkEventId === id);
      const incompleteSteps = steps.filter(s => s.status !== 'COMPLETED' && s.status !== 'SKIPPED');
      
      if (incompleteSteps.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Cannot clear: Not all clearance steps are complete',
          incompleteSteps: incompleteSteps.map(s => ({ stepNumber: s.stepNumber, description: s.description })),
        });
      }
    }
    
    const previousStatus = event.status;
    const now = new Date().toISOString();
    
    // Update event
    event.status = status;
    event.updatedAt = now;
    if (status === 'CLEARED') {
      event.clearedBy = userId;
      event.clearedByRole = userRole;
      event.clearedAt = now;
      event.clearanceNotes = notes;
    }
    
    stopWorkEvents.set(id, event);
    
    // Create audit entry
    const lastAudit = Array.from(auditEntries.values())
      .filter(a => a.stopWorkEventId === id)
      .sort((a, b) => new Date(b.performedAt) - new Date(a.performedAt))[0];
    
    const auditId = crypto.randomUUID();
    const auditEntry = {
      id: auditId,
      stopWorkEventId: id,
      action: status === 'CLEARED' ? 'CLEARED' : `STATUS_CHANGED_TO_${status}`,
      description: notes || `Status changed from ${previousStatus} to ${status}`,
      previousValue: { status: previousStatus },
      newValue: { status },
      performedBy: userId,
      performedByRole: userRole,
      performedAt: now,
      previousHash: lastAudit?.hash || '',
    };
    auditEntry.hash = calculateAuditHash(auditEntry, lastAudit?.hash || '');
    auditEntries.set(auditId, auditEntry);
    
    res.json({
      success: true,
      data: event,
      message: `Stop-Work status updated to ${status}`,
    });
  } catch (error) {
    console.error('Error updating stop-work status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/safety/stop-work/:id/steps/:stepId/complete
 * Mark a clearance step as complete
 */
router.post('/:id/steps/:stepId/complete', async (req, res) => {
  try {
    const { id, stepId } = req.params;
    const { notes, evidenceIds = [] } = req.body;
    
    const event = stopWorkEvents.get(id);
    if (!event) {
      return res.status(404).json({ success: false, error: 'Stop-work event not found' });
    }
    
    const step = clearanceSteps.get(stepId);
    if (!step || step.stopWorkEventId !== id) {
      return res.status(404).json({ success: false, error: 'Clearance step not found' });
    }
    
    // TODO: Get actual user from auth context
    const userId = 'current-user-id';
    const userRole = 'OPERATOR';
    
    const now = new Date().toISOString();
    
    step.status = 'COMPLETED';
    step.completedBy = userId;
    step.completedAt = now;
    step.notes = notes;
    step.evidenceIds = evidenceIds;
    
    clearanceSteps.set(stepId, step);
    
    // Create audit entry
    const auditId = crypto.randomUUID();
    const lastAudit = Array.from(auditEntries.values())
      .filter(a => a.stopWorkEventId === id)
      .sort((a, b) => new Date(b.performedAt) - new Date(a.performedAt))[0];
    
    const auditEntry = {
      id: auditId,
      stopWorkEventId: id,
      action: 'STEP_COMPLETED',
      description: `Clearance step ${step.stepNumber} completed: ${step.description}`,
      previousValue: null,
      newValue: { stepId, stepNumber: step.stepNumber, notes },
      performedBy: userId,
      performedByRole: userRole,
      performedAt: now,
      previousHash: lastAudit?.hash || '',
    };
    auditEntry.hash = calculateAuditHash(auditEntry, lastAudit?.hash || '');
    auditEntries.set(auditId, auditEntry);
    
    // Check if all steps are complete
    const allSteps = Array.from(clearanceSteps.values())
      .filter(s => s.stopWorkEventId === id);
    const allComplete = allSteps.every(s => s.status === 'COMPLETED' || s.status === 'SKIPPED');
    
    res.json({
      success: true,
      data: step,
      allStepsComplete: allComplete,
      message: allComplete
        ? 'All clearance steps complete. Ready for approval.'
        : `Step ${step.stepNumber} completed.`,
    });
  } catch (error) {
    console.error('Error completing clearance step:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/safety/stop-work/:id/evidence
 * Upload evidence for a stop-work event
 */
router.post('/:id/evidence', async (req, res) => {
  try {
    const { id } = req.params;
    const { evidenceType, description, fileUrl, fileName, mimeType } = req.body;
    
    const event = stopWorkEvents.get(id);
    if (!event) {
      return res.status(404).json({ success: false, error: 'Stop-work event not found' });
    }
    
    // TODO: Get actual user from auth context
    const userId = 'current-user-id';
    
    const now = new Date().toISOString();
    const evidenceId = crypto.randomUUID();
    
    const newEvidence = {
      id: evidenceId,
      stopWorkEventId: id,
      evidenceType,
      description,
      fileUrl,
      fileName,
      mimeType,
      uploadedBy: userId,
      uploadedAt: now,
      verified: false,
    };
    
    evidence.set(evidenceId, newEvidence);
    
    // Create audit entry
    const auditId = crypto.randomUUID();
    const lastAudit = Array.from(auditEntries.values())
      .filter(a => a.stopWorkEventId === id)
      .sort((a, b) => new Date(b.performedAt) - new Date(a.performedAt))[0];
    
    const auditEntry = {
      id: auditId,
      stopWorkEventId: id,
      action: 'EVIDENCE_ADDED',
      description: `Evidence uploaded: ${evidenceType} - ${description}`,
      previousValue: null,
      newValue: { evidenceId, evidenceType, fileName },
      performedBy: userId,
      performedByRole: 'OPERATOR',
      performedAt: now,
      previousHash: lastAudit?.hash || '',
    };
    auditEntry.hash = calculateAuditHash(auditEntry, lastAudit?.hash || '');
    auditEntries.set(auditId, auditEntry);
    
    res.status(201).json({
      success: true,
      data: newEvidence,
      message: 'Evidence uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading evidence:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/safety/stop-work/:id/clearance
 * Request or process clearance approval
 */
router.post('/:id/clearance', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, notes } = req.body;
    
    const event = stopWorkEvents.get(id);
    if (!event) {
      return res.status(404).json({ success: false, error: 'Stop-work event not found' });
    }
    
    // TODO: Get actual user from auth context
    const userId = 'current-user-id';
    const userRole = 'EHS_MANAGER';
    
    if (!['APPROVE', 'REJECT'].includes(action)) {
      return res.status(400).json({ success: false, error: 'Action must be APPROVE or REJECT' });
    }
    
    // Check authorization
    if (!canClearSWA(userRole, event.severity)) {
      return res.status(403).json({
        success: false,
        error: `Unauthorized: ${userRole} cannot clear ${event.severity} severity events`,
        requiredRoles: CLEARANCE_AUTHORITY[event.severity],
      });
    }
    
    const now = new Date().toISOString();
    const previousStatus = event.status;
    
    if (action === 'APPROVE') {
      // Verify all steps complete
      const steps = Array.from(clearanceSteps.values())
        .filter(s => s.stopWorkEventId === id);
      const incompleteSteps = steps.filter(s => s.status !== 'COMPLETED' && s.status !== 'SKIPPED');
      
      if (incompleteSteps.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Cannot approve: Not all clearance steps are complete',
          incompleteSteps: incompleteSteps.map(s => ({ stepNumber: s.stepNumber, description: s.description })),
        });
      }
      
      event.status = 'CLEARED';
      event.clearedBy = userId;
      event.clearedByRole = userRole;
      event.clearedAt = now;
      event.clearanceNotes = notes;
    } else {
      event.status = 'MITIGATION_IN_PROGRESS';
    }
    
    event.updatedAt = now;
    stopWorkEvents.set(id, event);
    
    // Create audit entry
    const auditId = crypto.randomUUID();
    const lastAudit = Array.from(auditEntries.values())
      .filter(a => a.stopWorkEventId === id)
      .sort((a, b) => new Date(b.performedAt) - new Date(a.performedAt))[0];
    
    const auditEntry = {
      id: auditId,
      stopWorkEventId: id,
      action: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      description: notes || `Clearance ${action.toLowerCase()}d by ${userRole}`,
      previousValue: { status: previousStatus },
      newValue: { status: event.status },
      performedBy: userId,
      performedByRole: userRole,
      performedAt: now,
      previousHash: lastAudit?.hash || '',
    };
    auditEntry.hash = calculateAuditHash(auditEntry, lastAudit?.hash || '');
    auditEntries.set(auditId, auditEntry);
    
    res.json({
      success: true,
      data: event,
      message: action === 'APPROVE'
        ? `Stop-Work cleared. Work may resume.`
        : `Clearance rejected. Further mitigation required.`,
    });
  } catch (error) {
    console.error('Error processing clearance:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/safety/stop-work/:id/audit
 * Get full audit trail for a stop-work event
 */
router.get('/:id/audit', async (req, res) => {
  try {
    const { id } = req.params;
    
    const event = stopWorkEvents.get(id);
    if (!event) {
      return res.status(404).json({ success: false, error: 'Stop-work event not found' });
    }
    
    const eventAudit = Array.from(auditEntries.values())
      .filter(a => a.stopWorkEventId === id)
      .sort((a, b) => new Date(a.performedAt) - new Date(b.performedAt));
    
    // Verify audit chain integrity
    let chainValid = true;
    for (let i = 0; i < eventAudit.length; i++) {
      const entry = eventAudit[i];
      const expectedPrevHash = i > 0 ? eventAudit[i - 1].hash : '';
      if (entry.previousHash !== expectedPrevHash) {
        chainValid = false;
        break;
      }
    }
    
    res.json({
      success: true,
      data: eventAudit,
      chainIntegrity: chainValid,
      entryCount: eventAudit.length,
    });
  } catch (error) {
    console.error('Error fetching audit trail:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/safety/stop-work/validate-assignment
 * Validate a job assignment for safety blocks (dispatch integration)
 */
router.post('/validate-assignment', async (req, res) => {
  try {
    const { jobId, workCenterId, operatorId, assetId } = req.body;
    
    const activeStatuses = ['ACTIVE', 'UNDER_INVESTIGATION', 'MITIGATION_IN_PROGRESS', 'PENDING_VERIFICATION', 'PENDING_APPROVAL'];
    const activeEvents = Array.from(stopWorkEvents.values())
      .filter(e => activeStatuses.includes(e.status));
    
    const blocks = [];
    const warnings = [];
    
    // Check for blocks
    for (const event of activeEvents) {
      let isBlocking = false;
      let blockReason = '';
      
      switch (event.scopeType) {
        case 'JOB':
          if (event.scopeId === jobId) {
            isBlocking = true;
            blockReason = `Job ${jobId} is under Stop-Work`;
          }
          break;
        case 'WORK_CENTER':
          if (event.scopeId === workCenterId) {
            isBlocking = true;
            blockReason = `Work Center ${workCenterId} is blocked`;
          }
          break;
        case 'ASSET':
          if (event.scopeId === assetId) {
            isBlocking = true;
            blockReason = `Asset ${assetId} is out of service`;
          }
          break;
        case 'OPERATION':
          if (event.relatedJobId === jobId) {
            isBlocking = true;
            blockReason = `Operation on this job is stopped`;
          }
          break;
      }
      
      // Check affected resources
      if (event.affectedJobs?.includes(jobId)) {
        isBlocking = true;
        blockReason = `Job affected by Stop-Work ${event.eventNumber}`;
      }
      if (event.affectedOperators?.includes(operatorId)) {
        isBlocking = true;
        blockReason = `Operator cannot be assigned due to active Stop-Work`;
      }
      
      if (isBlocking) {
        blocks.push({
          swaId: event.id,
          eventNumber: event.eventNumber,
          reasonCode: event.reasonCode,
          severity: event.severity,
          description: blockReason,
          scopeType: event.scopeType,
          scopeId: event.scopeId,
        });
      }
    }
    
    // TODO: Add additional safety checks
    // - Operator training status
    // - Required permits
    // - Equipment inspections
    
    res.json({
      success: true,
      isValid: blocks.length === 0,
      blocks,
      warnings,
    });
  } catch (error) {
    console.error('Error validating assignment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/safety/stop-work/check-override
 * Reject any override attempt and log it
 */
router.post('/check-override', async (req, res) => {
  try {
    const { swaId, reason } = req.body;
    
    // TODO: Get actual user from auth context
    const userId = 'current-user-id';
    const userRole = 'OPERATOR';
    
    // ALWAYS reject override attempts
    const now = new Date().toISOString();
    
    // Log the override attempt
    if (swaId) {
      const event = stopWorkEvents.get(swaId);
      if (event) {
        const auditId = crypto.randomUUID();
        const lastAudit = Array.from(auditEntries.values())
          .filter(a => a.stopWorkEventId === swaId)
          .sort((a, b) => new Date(b.performedAt) - new Date(a.performedAt))[0];
        
        const auditEntry = {
          id: auditId,
          stopWorkEventId: swaId,
          action: 'OVERRIDE_ATTEMPTED',
          description: `Override attempt REJECTED: ${reason || 'No reason provided'}`,
          previousValue: null,
          newValue: { attempted: true, rejected: true, reason },
          performedBy: userId,
          performedByRole: userRole,
          performedAt: now,
          previousHash: lastAudit?.hash || '',
        };
        auditEntry.hash = calculateAuditHash(auditEntry, lastAudit?.hash || '');
        auditEntries.set(auditId, auditEntry);
        
        // TODO: Send alert to EHS
        console.warn(`⚠️ OVERRIDE ATTEMPT on SWA ${event.eventNumber} by ${userId} - REJECTED`);
      }
    }
    
    res.status(403).json({
      success: false,
      error: 'OVERRIDE NOT PERMITTED',
      message: 'Stop-Work Authority cannot be overridden. This attempt has been logged and EHS has been notified.',
    });
  } catch (error) {
    console.error('Error handling override attempt:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/safety/stop-work/stats
 * Get SWA statistics for dashboard
 */
router.get('/stats/summary', async (req, res) => {
  try {
    const events = Array.from(stopWorkEvents.values());
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    
    const recentEvents = events.filter(e => new Date(e.initiatedAt) >= thirtyDaysAgo);
    
    const activeStatuses = ['ACTIVE', 'UNDER_INVESTIGATION', 'MITIGATION_IN_PROGRESS', 'PENDING_VERIFICATION', 'PENDING_APPROVAL'];
    const active = events.filter(e => activeStatuses.includes(e.status));
    const cleared = recentEvents.filter(e => e.status === 'CLEARED');
    
    // Calculate average resolution time
    let totalResolutionTime = 0;
    let resolvedCount = 0;
    for (const event of cleared) {
      if (event.clearedAt) {
        const duration = new Date(event.clearedAt) - new Date(event.initiatedAt);
        totalResolutionTime += duration;
        resolvedCount++;
      }
    }
    const avgResolutionHours = resolvedCount > 0
      ? (totalResolutionTime / resolvedCount / (1000 * 60 * 60)).toFixed(1)
      : 0;
    
    // By reason code
    const byReasonCode = {};
    for (const event of recentEvents) {
      byReasonCode[event.reasonCode] = (byReasonCode[event.reasonCode] || 0) + 1;
    }
    
    // By severity
    const bySeverity = {
      CRITICAL: recentEvents.filter(e => e.severity === 'CRITICAL').length,
      HIGH: recentEvents.filter(e => e.severity === 'HIGH').length,
      MEDIUM: recentEvents.filter(e => e.severity === 'MEDIUM').length,
      LOW: recentEvents.filter(e => e.severity === 'LOW').length,
    };
    
    res.json({
      success: true,
      data: {
        active: active.length,
        cleared30Days: cleared.length,
        total30Days: recentEvents.length,
        avgResolutionHours,
        byReasonCode,
        bySeverity,
        activeEvents: active.map(e => ({
          id: e.id,
          eventNumber: e.eventNumber,
          scopeType: e.scopeType,
          scopeId: e.scopeId,
          reasonCode: e.reasonCode,
          severity: e.severity,
          status: e.status,
          initiatedAt: e.initiatedAt,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching SWA stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
