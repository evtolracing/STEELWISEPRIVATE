/**
 * Stop-Work Authority Clearance Workflow
 * 
 * Guides users through the clearance process with step-by-step verification,
 * evidence collection, and approval workflow.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  AlertTitle,
  TextField,
  Divider,
  Stack,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  PriorityHigh as CriticalIcon,
  PlayArrow as ResumeIcon,
  ArrowBack as BackIcon,
  Upload as UploadIcon,
  Camera as CameraIcon,
  Description as DocIcon,
  History as HistoryIcon,
  Person as PersonIcon,
  Verified as VerifiedIcon,
  ExpandMore as ExpandMoreIcon,
  Timeline as TimelineIcon,
  Security as SecurityIcon,
  Error as ErrorIcon,
  Lock as LockIcon,
  LockOpen as UnlockIcon,
  Send as SendIcon,
  Close as CloseIcon,
  ThumbUp as ApproveIcon,
  ThumbDown as RejectIcon,
  NavigateNext as NavigateNextIcon,
} from '@mui/icons-material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import dayjs from 'dayjs';

// Severity colors
const severityColors = {
  CRITICAL: '#d32f2f',
  HIGH: '#f57c00',
  MEDIUM: '#ffa000',
  LOW: '#4caf50',
};

// Status colors
const statusColors = {
  ACTIVE: '#d32f2f',
  UNDER_INVESTIGATION: '#9c27b0',
  MITIGATION_IN_PROGRESS: '#f57c00',
  PENDING_VERIFICATION: '#2196f3',
  PENDING_APPROVAL: '#00bcd4',
  CLEARED: '#4caf50',
  ESCALATED: '#d50000',
};

// Mock event data
const mockEvent = {
  id: 'swa-001',
  eventNumber: 'SWA-2024-001',
  scopeType: 'WORK_CENTER',
  scopeId: 'WC-SAW-001',
  scopeDescription: 'Saw Line 1',
  reasonCode: 'MISSING_LOTO_PERMIT',
  severity: 'CRITICAL',
  status: 'MITIGATION_IN_PROGRESS',
  description: 'LOTO permit not in place for maintenance work on Saw Line 1. Operator attempted to start equipment without verifying lockout/tagout status.',
  immediateCause: 'Maintenance work in progress without proper energy isolation',
  initiatedBy: 'John Smith',
  initiatedByRole: 'OPERATOR',
  initiatedAt: dayjs().subtract(2, 'hour').toISOString(),
  affectedJobs: ['JOB-001', 'JOB-002'],
  affectedOperators: [],
  clearanceSteps: [
    {
      id: 'step-1',
      stepNumber: 1,
      description: 'Obtain LOTO permit from supervisor',
      requiredRole: 'OPERATOR',
      status: 'COMPLETED',
      completedBy: 'John Smith',
      completedAt: dayjs().subtract(1, 'hour').toISOString(),
      notes: 'Permit obtained from Supervisor Mike Johnson',
    },
    {
      id: 'step-2',
      stepNumber: 2,
      description: 'Verify all energy sources identified and listed',
      requiredRole: 'SUPERVISOR',
      status: 'COMPLETED',
      completedBy: 'Mike Johnson',
      completedAt: dayjs().subtract(45, 'minute').toISOString(),
      notes: 'All 4 energy sources identified: Main power, hydraulic, pneumatic, stored energy',
    },
    {
      id: 'step-3',
      stepNumber: 3,
      description: 'Apply personal locks and tags to all isolation points',
      requiredRole: 'OPERATOR',
      status: 'IN_PROGRESS',
      completedBy: null,
      completedAt: null,
      notes: null,
    },
    {
      id: 'step-4',
      stepNumber: 4,
      description: 'Verify zero energy state (test equipment start)',
      requiredRole: 'SUPERVISOR',
      status: 'PENDING',
      completedBy: null,
      completedAt: null,
      notes: null,
    },
  ],
  auditTrail: [
    {
      id: 'audit-1',
      action: 'INITIATED',
      description: 'Stop-Work initiated: MISSING_LOTO_PERMIT',
      performedBy: 'John Smith',
      performedByRole: 'OPERATOR',
      performedAt: dayjs().subtract(2, 'hour').toISOString(),
    },
    {
      id: 'audit-2',
      action: 'STATUS_CHANGED_TO_UNDER_INVESTIGATION',
      description: 'Status changed to Under Investigation',
      performedBy: 'Mike Johnson',
      performedByRole: 'SUPERVISOR',
      performedAt: dayjs().subtract(1.5, 'hour').toISOString(),
    },
    {
      id: 'audit-3',
      action: 'STATUS_CHANGED_TO_MITIGATION_IN_PROGRESS',
      description: 'Mitigation steps initiated',
      performedBy: 'Mike Johnson',
      performedByRole: 'SUPERVISOR',
      performedAt: dayjs().subtract(1.25, 'hour').toISOString(),
    },
    {
      id: 'audit-4',
      action: 'STEP_COMPLETED',
      description: 'Clearance step 1 completed: Obtain LOTO permit from supervisor',
      performedBy: 'John Smith',
      performedByRole: 'OPERATOR',
      performedAt: dayjs().subtract(1, 'hour').toISOString(),
    },
    {
      id: 'audit-5',
      action: 'STEP_COMPLETED',
      description: 'Clearance step 2 completed: Verify all energy sources identified and listed',
      performedBy: 'Mike Johnson',
      performedByRole: 'SUPERVISOR',
      performedAt: dayjs().subtract(45, 'minute').toISOString(),
    },
  ],
  evidence: [
    {
      id: 'ev-1',
      evidenceType: 'PHOTO',
      description: 'LOTO permit posted at machine',
      fileName: 'loto_permit_photo.jpg',
      uploadedBy: 'John Smith',
      uploadedAt: dayjs().subtract(55, 'minute').toISOString(),
    },
  ],
};

export default function StopWorkClearance() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stepNotes, setStepNotes] = useState('');
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');

  // Current user mock (would come from auth context)
  const currentUser = {
    id: 'user-1',
    name: 'Mike Johnson',
    role: 'SUPERVISOR',
  };

  useEffect(() => {
    // TODO: Replace with actual API call
    // fetch(`/api/safety/stop-work/${id}`)
    //   .then(res => res.json())
    //   .then(data => setEvent(data));
    
    setTimeout(() => {
      setEvent(mockEvent);
      setLoading(false);
    }, 500);
  }, [id]);

  const getCurrentStep = () => {
    if (!event) return null;
    return event.clearanceSteps.find(s => s.status === 'IN_PROGRESS' || s.status === 'PENDING');
  };

  const getCompletedSteps = () => {
    if (!event) return 0;
    return event.clearanceSteps.filter(s => s.status === 'COMPLETED').length;
  };

  const handleCompleteStep = async (stepId) => {
    // TODO: Replace with actual API call
    // await fetch(`/api/safety/stop-work/${id}/steps/${stepId}/complete`, {
    //   method: 'POST',
    //   body: JSON.stringify({ notes: stepNotes }),
    // });
    
    setEvent(prev => ({
      ...prev,
      clearanceSteps: prev.clearanceSteps.map(s =>
        s.id === stepId
          ? {
              ...s,
              status: 'COMPLETED',
              completedBy: currentUser.name,
              completedAt: new Date().toISOString(),
              notes: stepNotes,
            }
          : s.id === prev.clearanceSteps.find(cs => cs.id === stepId)?.stepNumber + 1
          ? { ...s, status: 'IN_PROGRESS' }
          : s
      ),
    }));
    setStepNotes('');
  };

  const handleRequestApproval = () => {
    setApprovalDialogOpen(true);
  };

  const handleSubmitApproval = async (action) => {
    // TODO: Replace with actual API call
    // await fetch(`/api/safety/stop-work/${id}/clearance`, {
    //   method: 'POST',
    //   body: JSON.stringify({ action, notes: approvalNotes }),
    // });
    
    if (action === 'APPROVE') {
      setEvent(prev => ({
        ...prev,
        status: 'CLEARED',
        clearedBy: currentUser.name,
        clearedAt: new Date().toISOString(),
      }));
    }
    setApprovalDialogOpen(false);
    setApprovalNotes('');
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading stop-work event...</Typography>
      </Box>
    );
  }

  if (!event) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          <AlertTitle>Event Not Found</AlertTitle>
          The stop-work event could not be found.
        </Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/safety/stop-work')} sx={{ mt: 2 }}>
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  const currentStep = getCurrentStep();
  const allStepsComplete = event.clearanceSteps.every(s => s.status === 'COMPLETED');
  const isCleared = event.status === 'CLEARED';

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/safety" color="inherit" underline="hover">
          Safety
        </Link>
        <Link component={RouterLink} to="/safety/stop-work" color="inherit" underline="hover">
          Stop-Work Authority
        </Link>
        <Typography color="text.primary">{event.eventNumber}</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isCleared ? (
              <CheckCircleIcon fontSize="large" color="success" />
            ) : (
              <SecurityIcon fontSize="large" color="error" />
            )}
            {event.eventNumber}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <Chip
              label={event.severity}
              size="small"
              sx={{ bgcolor: severityColors[event.severity], color: 'white', fontWeight: 600 }}
              icon={event.severity === 'CRITICAL' ? <CriticalIcon sx={{ color: 'white !important' }} /> : undefined}
            />
            <Chip
              label={event.status.replace(/_/g, ' ')}
              size="small"
              sx={{ bgcolor: statusColors[event.status] + '20', color: statusColors[event.status], border: `1px solid ${statusColors[event.status]}` }}
              icon={isCleared ? <CheckCircleIcon /> : <LockIcon />}
            />
          </Box>
        </Box>
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={() => navigate('/safety/stop-work')}
        >
          Back to Dashboard
        </Button>
      </Box>

      {/* Cleared Banner */}
      {isCleared && (
        <Alert severity="success" icon={<UnlockIcon />} sx={{ mb: 3 }}>
          <AlertTitle>Stop-Work Cleared</AlertTitle>
          Work may resume on {event.scopeDescription}. Cleared by {event.clearedBy} at {dayjs(event.clearedAt).format('MMM D, YYYY h:mm A')}.
        </Alert>
      )}

      {/* Active Stop-Work Banner */}
      {!isCleared && (
        <Alert severity="error" icon={<BlockIcon />} sx={{ mb: 3 }}>
          <AlertTitle>Active Stop-Work</AlertTitle>
          All work on {event.scopeDescription} is blocked until clearance is complete.
          {event.affectedJobs.length > 0 && (
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              Affected jobs: {event.affectedJobs.join(', ')}
            </Typography>
          )}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column - Event Details */}
        <Grid item xs={12} md={4}>
          <Stack spacing={2}>
            {/* Event Info Card */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Event Details</Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={1.5}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Scope</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {event.scopeType}: {event.scopeDescription}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Reason Code</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {event.reasonCode.replace(/_/g, ' ')}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Description</Typography>
                  <Typography variant="body2">{event.description}</Typography>
                </Box>
                {event.immediateCause && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Immediate Cause</Typography>
                    <Typography variant="body2">{event.immediateCause}</Typography>
                  </Box>
                )}
                <Divider />
                <Box>
                  <Typography variant="caption" color="text.secondary">Initiated By</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Avatar sx={{ width: 28, height: 28 }}>
                      <PersonIcon fontSize="small" />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>{event.initiatedBy}</Typography>
                      <Typography variant="caption" color="text.secondary">{event.initiatedByRole}</Typography>
                    </Box>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Initiated At</Typography>
                  <Typography variant="body2">
                    {dayjs(event.initiatedAt).format('MMM D, YYYY h:mm A')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ({dayjs(event.initiatedAt).fromNow()})
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            {/* Evidence Card */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DocIcon fontSize="small" />
                Evidence ({event.evidence.length})
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List dense>
                {event.evidence.map((ev) => (
                  <ListItem key={ev.id} sx={{ bgcolor: 'grey.50', borderRadius: 1, mb: 1 }}>
                    <ListItemIcon>
                      {ev.evidenceType === 'PHOTO' ? <CameraIcon color="primary" /> : <DocIcon color="primary" />}
                    </ListItemIcon>
                    <ListItemText
                      primary={ev.description}
                      secondary={`${ev.fileName} • ${dayjs(ev.uploadedAt).format('h:mm A')}`}
                    />
                  </ListItem>
                ))}
              </List>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<UploadIcon />}
                disabled={isCleared}
              >
                Upload Evidence
              </Button>
            </Paper>
          </Stack>
        </Grid>

        {/* Right Column - Clearance Workflow */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VerifiedIcon color="primary" />
                  Clearance Workflow
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {getCompletedSteps()} of {event.clearanceSteps.length} steps completed
                </Typography>
              </Box>
              {allStepsComplete && !isCleared && (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<SendIcon />}
                  onClick={handleRequestApproval}
                >
                  Request Final Approval
                </Button>
              )}
            </Box>

            {/* Progress Bar */}
            <Box sx={{ mb: 3 }}>
              <LinearProgress
                variant="determinate"
                value={(getCompletedSteps() / event.clearanceSteps.length) * 100}
                sx={{ height: 8, borderRadius: 4 }}
                color={isCleared ? 'success' : 'primary'}
              />
            </Box>

            {/* Steps */}
            <Stepper orientation="vertical">
              {event.clearanceSteps.map((step, index) => {
                const isComplete = step.status === 'COMPLETED';
                const isCurrent = step.status === 'IN_PROGRESS';
                const isPending = step.status === 'PENDING';

                return (
                  <Step key={step.id} active={isCurrent || isComplete} completed={isComplete}>
                    <StepLabel
                      optional={
                        <Typography variant="caption" color="text.secondary">
                          Required role: {step.requiredRole}
                        </Typography>
                      }
                      StepIconComponent={() => (
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: isComplete
                              ? 'success.main'
                              : isCurrent
                              ? 'primary.main'
                              : 'grey.300',
                            fontSize: '0.9rem',
                          }}
                        >
                          {isComplete ? <CheckCircleIcon fontSize="small" /> : step.stepNumber}
                        </Avatar>
                      )}
                    >
                      <Typography
                        variant="body1"
                        fontWeight={isCurrent ? 600 : 400}
                        sx={{ color: isPending ? 'text.disabled' : 'text.primary' }}
                      >
                        {step.description}
                      </Typography>
                    </StepLabel>
                    <StepContent>
                      {isComplete ? (
                        <Box sx={{ bgcolor: 'success.50', p: 2, borderRadius: 1, mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <CheckCircleIcon color="success" fontSize="small" />
                            <Typography variant="body2" fontWeight={500} color="success.main">
                              Completed by {step.completedBy}
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {dayjs(step.completedAt).format('MMM D, YYYY h:mm A')}
                          </Typography>
                          {step.notes && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              Notes: {step.notes}
                            </Typography>
                          )}
                        </Box>
                      ) : isCurrent ? (
                        <Box sx={{ mb: 2 }}>
                          <TextField
                            fullWidth
                            multiline
                            rows={2}
                            placeholder="Add notes about this step..."
                            value={stepNotes}
                            onChange={(e) => setStepNotes(e.target.value)}
                            size="small"
                            sx={{ mb: 2 }}
                          />
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              variant="contained"
                              color="primary"
                              startIcon={<CheckCircleIcon />}
                              onClick={() => handleCompleteStep(step.id)}
                            >
                              Mark Complete
                            </Button>
                            <Button variant="outlined" startIcon={<UploadIcon />}>
                              Add Evidence
                            </Button>
                          </Box>
                        </Box>
                      ) : null}
                    </StepContent>
                  </Step>
                );
              })}
            </Stepper>
          </Paper>

          {/* Audit Trail */}
          <Accordion sx={{ mt: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <HistoryIcon />
                Audit Trail ({event.auditTrail.length} entries)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List dense>
                {event.auditTrail.map((entry, index) => (
                  <ListItem key={entry.id} sx={{ borderLeft: '2px solid', borderColor: 'primary.main', pl: 2, mb: 1 }}>
                    <ListItemIcon>
                      <Avatar sx={{ width: 28, height: 28, bgcolor: 'grey.200' }}>
                        <TimelineIcon fontSize="small" color="action" />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={entry.description}
                      secondary={
                        <>
                          {entry.performedBy} ({entry.performedByRole}) • {dayjs(entry.performedAt).format('MMM D, h:mm A')}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>

      {/* Approval Dialog */}
      <Dialog open={approvalDialogOpen} onClose={() => setApprovalDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <VerifiedIcon color="primary" />
          Final Clearance Approval
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            <AlertTitle>Review Complete</AlertTitle>
            All {event.clearanceSteps.length} clearance steps have been completed. Approving will clear the stop-work and allow work to resume.
          </Alert>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            As the approving authority, you are verifying that all safety concerns have been addressed and it is safe to resume work.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Approval Notes (Optional)"
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
            placeholder="Add any notes about this clearance..."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setApprovalDialogOpen(false)} startIcon={<CloseIcon />}>
            Cancel
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<RejectIcon />}
            onClick={() => handleSubmitApproval('REJECT')}
          >
            Reject
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<ApproveIcon />}
            onClick={() => handleSubmitApproval('APPROVE')}
          >
            Approve & Clear
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
