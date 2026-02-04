/**
 * Inspection Detail Page
 * View inspection details and complete inspection checklists
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Stack,
  Chip,
  Grid,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  TextField,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Checkbox,
  Alert,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Assignment as InspectionIcon,
  CheckCircle as PassIcon,
  Cancel as FailIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CameraAlt as CameraIcon,
  Note as NoteIcon,
  Save as SaveIcon,
  Send as SubmitIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

// Mock inspection detail with checklist
const mockInspectionDetail = {
  id: 'INS-2026-0122',
  type: 'FORKLIFT_DAILY',
  name: 'Forklift Daily Inspection',
  equipment: 'Forklift #12',
  equipmentId: 'EQ-FL-012',
  location: 'Warehouse A',
  assignee: {
    id: 'EMP-001',
    name: 'Mike Johnson',
    role: 'Forklift Operator',
  },
  scheduledDate: '2026-02-02',
  dueDate: '2026-02-02',
  status: 'COMPLETED',
  completedDate: '2026-02-02',
  completedBy: 'Mike Johnson',
  score: 100,
  duration: '12 minutes',
  checklist: {
    sections: [
      {
        id: 'pre-operation',
        title: 'Pre-Operation Visual Checks',
        items: [
          { id: 1, question: 'Check for leaks (oil, hydraulic, coolant)', type: 'pass_fail', required: true, response: 'pass', notes: '' },
          { id: 2, question: 'Inspect tires/wheels for damage or wear', type: 'pass_fail', required: true, response: 'pass', notes: '' },
          { id: 3, question: 'Check forks for cracks, bends, or wear', type: 'pass_fail', required: true, response: 'pass', notes: '' },
          { id: 4, question: 'Verify mast chains are lubricated and intact', type: 'pass_fail', required: true, response: 'pass', notes: '' },
          { id: 5, question: 'Check overhead guard for damage', type: 'pass_fail', required: true, response: 'pass', notes: '' },
        ],
      },
      {
        id: 'controls',
        title: 'Controls & Safety Devices',
        items: [
          { id: 6, question: 'Test horn functionality', type: 'pass_fail', required: true, response: 'pass', notes: '' },
          { id: 7, question: 'Check all lights (head, tail, warning)', type: 'pass_fail', required: true, response: 'pass', notes: '' },
          { id: 8, question: 'Test backup alarm', type: 'pass_fail', required: true, response: 'pass', notes: '' },
          { id: 9, question: 'Verify seat belt functions properly', type: 'pass_fail', required: true, response: 'pass', notes: '' },
          { id: 10, question: 'Test emergency stop/parking brake', type: 'pass_fail', required: true, response: 'pass', notes: '' },
        ],
      },
      {
        id: 'operation',
        title: 'Operational Checks',
        items: [
          { id: 11, question: 'Test steering responsiveness', type: 'pass_fail', required: true, response: 'pass', notes: '' },
          { id: 12, question: 'Check brake operation', type: 'pass_fail', required: true, response: 'pass', notes: '' },
          { id: 13, question: 'Test lift/lower functions', type: 'pass_fail', required: true, response: 'pass', notes: '' },
          { id: 14, question: 'Test tilt forward/backward', type: 'pass_fail', required: true, response: 'pass', notes: '' },
          { id: 15, question: 'Check fuel/battery level', type: 'pass_fail', required: true, response: 'pass', notes: 'Battery at 85%' },
        ],
      },
      {
        id: 'documentation',
        title: 'Documentation',
        items: [
          { id: 16, question: 'Record hour meter reading', type: 'numeric', required: true, response: '4,523', notes: '' },
          { id: 17, question: 'Any additional observations?', type: 'text', required: false, response: 'All systems functioning normally. Unit is in good condition.', notes: '' },
        ],
      },
    ],
  },
  previousInspections: [
    { id: 'INS-2026-0121', date: '2026-02-01', score: 100, status: 'COMPLETED' },
    { id: 'INS-2026-0120', date: '2026-01-31', score: 95, status: 'COMPLETED' },
    { id: 'INS-2026-0119', date: '2026-01-30', score: 100, status: 'COMPLETED' },
  ],
  defectsFound: [],
  photos: [],
};

function getStatusColor(status) {
  switch (status) {
    case 'COMPLETED': return 'success';
    case 'IN_PROGRESS': return 'warning';
    case 'SCHEDULED': return 'info';
    case 'OVERDUE': return 'error';
    default: return 'default';
  }
}

function getScoreColor(score) {
  if (score >= 90) return 'success';
  if (score >= 70) return 'warning';
  return 'error';
}

function ChecklistItem({ item, readonly, onUpdate }) {
  const [notes, setNotes] = useState(item.notes || '');
  const [response, setResponse] = useState(item.response || '');

  const handleResponseChange = (value) => {
    setResponse(value);
    if (onUpdate) {
      onUpdate({ ...item, response: value, notes });
    }
  };

  const handleNotesChange = (value) => {
    setNotes(value);
    if (onUpdate) {
      onUpdate({ ...item, response, notes: value });
    }
  };

  return (
    <Box sx={{ py: 1.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body1">
            {item.question}
            {item.required && <Typography component="span" color="error"> *</Typography>}
          </Typography>
        </Box>
        
        <Box sx={{ minWidth: 200 }}>
          {item.type === 'pass_fail' && (
            <Stack direction="row" spacing={1}>
              {readonly ? (
                <Chip
                  icon={response === 'pass' ? <PassIcon /> : response === 'fail' ? <FailIcon /> : <WarningIcon />}
                  label={response === 'pass' ? 'Pass' : response === 'fail' ? 'Fail' : response === 'na' ? 'N/A' : 'Not Answered'}
                  size="small"
                  color={response === 'pass' ? 'success' : response === 'fail' ? 'error' : 'default'}
                />
              ) : (
                <RadioGroup
                  row
                  value={response}
                  onChange={(e) => handleResponseChange(e.target.value)}
                >
                  <FormControlLabel
                    value="pass"
                    control={<Radio size="small" color="success" />}
                    label="Pass"
                  />
                  <FormControlLabel
                    value="fail"
                    control={<Radio size="small" color="error" />}
                    label="Fail"
                  />
                  <FormControlLabel
                    value="na"
                    control={<Radio size="small" />}
                    label="N/A"
                  />
                </RadioGroup>
              )}
            </Stack>
          )}
          
          {item.type === 'numeric' && (
            readonly ? (
              <Typography fontWeight={600}>{response}</Typography>
            ) : (
              <TextField
                size="small"
                value={response}
                onChange={(e) => handleResponseChange(e.target.value)}
                placeholder="Enter value"
              />
            )
          )}
          
          {item.type === 'text' && (
            readonly ? (
              <Typography>{response || '-'}</Typography>
            ) : (
              <TextField
                size="small"
                fullWidth
                multiline
                rows={2}
                value={response}
                onChange={(e) => handleResponseChange(e.target.value)}
                placeholder="Enter response"
              />
            )
          )}
        </Box>
      </Stack>
      
      {(item.notes || !readonly) && (
        <Box sx={{ mt: 1, ml: 2 }}>
          {readonly ? (
            item.notes && (
              <Typography variant="body2" color="text.secondary">
                <NoteIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                {item.notes}
              </Typography>
            )
          ) : (
            <TextField
              size="small"
              fullWidth
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Add notes (optional)"
              InputProps={{
                startAdornment: <NoteIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          )}
        </Box>
      )}
    </Box>
  );
}

export default function InspectionDetailPage() {
  const navigate = useNavigate();
  const { inspectionId } = useParams();
  const [searchParams] = useSearchParams();
  const [inspection, setInspection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);

  useEffect(() => {
    // Simulate API call
    setLoading(true);
    setTimeout(() => {
      const data = { ...mockInspectionDetail };
      // If coming from "Start Inspection", set as in progress
      if (searchParams.get('start') === 'true' && data.status !== 'COMPLETED') {
        data.status = 'IN_PROGRESS';
        setIsEditing(true);
      }
      setInspection(data);
      setLoading(false);
    }, 500);
  }, [inspectionId, searchParams]);

  const handleUpdateItem = (sectionIndex, itemId, updatedItem) => {
    const newInspection = { ...inspection };
    const section = newInspection.checklist.sections[sectionIndex];
    const itemIndex = section.items.findIndex(i => i.id === itemId);
    section.items[itemIndex] = updatedItem;
    setInspection(newInspection);
  };

  const handleSubmit = () => {
    // Calculate score
    let totalItems = 0;
    let passedItems = 0;
    inspection.checklist.sections.forEach(section => {
      section.items.forEach(item => {
        if (item.type === 'pass_fail' && item.required) {
          totalItems++;
          if (item.response === 'pass' || item.response === 'na') {
            passedItems++;
          }
        }
      });
    });
    const score = Math.round((passedItems / totalItems) * 100);

    // Update inspection
    setInspection({
      ...inspection,
      status: 'COMPLETED',
      completedDate: new Date().toISOString().split('T')[0],
      score,
    });
    setIsEditing(false);
    setSubmitDialogOpen(false);
  };

  const calculateProgress = () => {
    let answered = 0;
    let total = 0;
    inspection.checklist.sections.forEach(section => {
      section.items.forEach(item => {
        if (item.required) {
          total++;
          if (item.response) answered++;
        }
      });
    });
    return { answered, total, percent: Math.round((answered / total) * 100) };
  };

  if (loading || !inspection) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
      </Box>
    );
  }

  const progress = isEditing ? calculateProgress() : null;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <IconButton onClick={() => navigate('/safety/inspections')} size="small">
              <BackIcon />
            </IconButton>
            <Typography variant="h4" fontWeight={700}>
              {inspection.id}
            </Typography>
            <Chip label={inspection.status.replace('_', ' ')} color={getStatusColor(inspection.status)} />
            {inspection.score !== null && (
              <Chip 
                label={`Score: ${inspection.score}%`} 
                color={getScoreColor(inspection.score)} 
                variant="outlined"
              />
            )}
          </Stack>
          <Typography variant="h6" sx={{ ml: 5 }}>
            {inspection.name} - {inspection.equipment}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          {inspection.status === 'COMPLETED' && (
            <>
              <Button variant="outlined" startIcon={<PrintIcon />}>Print</Button>
              <Button variant="outlined" startIcon={<DownloadIcon />}>Download PDF</Button>
            </>
          )}
          {inspection.status !== 'COMPLETED' && !isEditing && (
            <Button variant="contained" startIcon={<StartIcon />} onClick={() => setIsEditing(true)}>
              Start Inspection
            </Button>
          )}
        </Stack>
      </Stack>

      {/* Progress Bar (when editing) */}
      {isEditing && progress && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="subtitle2">Progress:</Typography>
            <Box sx={{ flex: 1 }}>
              <LinearProgress 
                variant="determinate" 
                value={progress.percent} 
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Box>
            <Typography variant="body2">
              {progress.answered} / {progress.total} ({progress.percent}%)
            </Typography>
          </Stack>
        </Paper>
      )}

      <Grid container spacing={3}>
        {/* Main Content - Checklist */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">Inspection Checklist</Typography>
              {isEditing && (
                <Stack direction="row" spacing={1}>
                  <Button 
                    variant="outlined" 
                    startIcon={<SaveIcon />}
                    onClick={() => {/* Save draft */}}
                  >
                    Save Draft
                  </Button>
                  <Button 
                    variant="contained" 
                    color="success"
                    startIcon={<SubmitIcon />}
                    onClick={() => setSubmitDialogOpen(true)}
                    disabled={progress.percent < 100}
                  >
                    Submit
                  </Button>
                </Stack>
              )}
            </Stack>

            <Stepper activeStep={activeSection} orientation="vertical" nonLinear>
              {inspection.checklist.sections.map((section, sectionIndex) => (
                <Step key={section.id} completed={false}>
                  <StepLabel 
                    onClick={() => setActiveSection(sectionIndex)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <Typography variant="subtitle1" fontWeight={600}>
                      {section.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {section.items.length} items
                    </Typography>
                  </StepLabel>
                  <StepContent>
                    <List sx={{ py: 0 }}>
                      {section.items.map((item, itemIndex) => (
                        <Box key={item.id}>
                          {itemIndex > 0 && <Divider />}
                          <ChecklistItem
                            item={item}
                            readonly={!isEditing}
                            onUpdate={(updatedItem) => handleUpdateItem(sectionIndex, item.id, updatedItem)}
                          />
                        </Box>
                      ))}
                    </List>
                    
                    <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                      {sectionIndex > 0 && (
                        <Button onClick={() => setActiveSection(sectionIndex - 1)}>
                          Previous
                        </Button>
                      )}
                      {sectionIndex < inspection.checklist.sections.length - 1 && (
                        <Button 
                          variant="contained"
                          onClick={() => setActiveSection(sectionIndex + 1)}
                        >
                          Next Section
                        </Button>
                      )}
                    </Stack>
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </Paper>
        </Grid>

        {/* Right Column - Info */}
        <Grid item xs={12} md={4}>
          {/* Inspection Details */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Inspection Details
            </Typography>
            <List dense>
              <ListItem sx={{ px: 0 }}>
                <ListItemText primary="Equipment" secondary={`${inspection.equipment} (${inspection.equipmentId})`} />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemText primary="Location" secondary={inspection.location} />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemText primary="Scheduled Date" secondary={inspection.scheduledDate} />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemText 
                  primary="Assignee" 
                  secondary={`${inspection.assignee.name} (${inspection.assignee.role})`} 
                />
              </ListItem>
              {inspection.completedDate && (
                <>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText primary="Completed Date" secondary={inspection.completedDate} />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText primary="Duration" secondary={inspection.duration} />
                  </ListItem>
                </>
              )}
            </List>
          </Paper>

          {/* Previous Inspections */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Previous Inspections
            </Typography>
            <List dense>
              {inspection.previousInspections.map((prev) => (
                <ListItem 
                  key={prev.id} 
                  sx={{ px: 0, cursor: 'pointer' }}
                  onClick={() => navigate(`/safety/inspections/${prev.id}`)}
                >
                  <ListItemText 
                    primary={prev.date}
                    secondary={prev.id}
                  />
                  <Chip 
                    label={`${prev.score}%`} 
                    size="small" 
                    color={getScoreColor(prev.score)} 
                  />
                </ListItem>
              ))}
            </List>
          </Paper>

          {/* Add Photo (when editing) */}
          {isEditing && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Add Photos
              </Typography>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<CameraIcon />}
                sx={{ py: 3 }}
              >
                Take Photo or Upload
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Add photos of any defects or notable observations
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Submit Confirmation Dialog */}
      <Dialog open={submitDialogOpen} onClose={() => setSubmitDialogOpen(false)}>
        <DialogTitle>Submit Inspection</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to submit this inspection? Once submitted, it cannot be modified.
          </Typography>
          {progress && (
            <Alert severity="info" sx={{ mt: 2 }}>
              {progress.answered} of {progress.total} required items answered.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmitDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleSubmit}>
            Submit Inspection
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
