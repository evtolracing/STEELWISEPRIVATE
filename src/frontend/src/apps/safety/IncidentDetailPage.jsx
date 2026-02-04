/**
 * Incident Detail Page
 * View and manage individual incident details, investigation, and CAPAs
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  Tabs,
  Tab,
  TextField,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  Warning as WarningIcon,
  LocalHospital as MedicalIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Description as DescriptionIcon,
  Assignment as InvestigateIcon,
  CheckCircle as CheckIcon,
  Add as AddIcon,
  AttachFile as AttachIcon,
  Comment as CommentIcon,
  History as HistoryIcon,
  Close as CloseIcon,
  PlayArrow as StartIcon,
  TaskAlt as TaskIcon,
  Flag as FlagIcon,
  Build as CAPAIcon,
  VerifiedUser as VerifiedIcon,
} from '@mui/icons-material';

// Mock incident data
const mockIncidentDetail = {
  id: 'INC-2026-0043',
  type: 'NEAR_MISS',
  severity: 'MEDIUM',
  title: 'Crane load shift during lift',
  description: 'During a routine lift operation in Bay 3, the load (steel coil, approx. 5000 lbs) shifted unexpectedly when being transported from the staging area to the processing line. The load swung approximately 18 inches to the left, coming within 3 feet of an employee who was walking in the designated pedestrian pathway.',
  location: 'Bay 3 - Production Floor',
  department: 'Production',
  shift: 'Day Shift',
  incidentDate: '2026-01-25',
  incidentTime: '10:45',
  reportedBy: {
    id: 'EMP-001',
    name: 'Tom Brown',
    role: 'Crane Operator',
    avatar: null,
  },
  reportedDate: '2026-01-25',
  status: 'CAPA_ASSIGNED',
  assignee: {
    id: 'EMP-002',
    name: 'Sarah Williams',
    role: 'Safety Manager',
    avatar: null,
  },
  witnesses: [
    { id: 'EMP-003', name: 'Mike Johnson', role: 'Production Worker' },
    { id: 'EMP-004', name: 'Lisa Davis', role: 'Quality Inspector' },
  ],
  immediateActions: [
    'Stopped all crane operations in Bay 3',
    'Secured the load in a safe position',
    'Cleared the area and established safety perimeter',
    'Notified shift supervisor and safety manager',
    'Documented scene with photos',
  ],
  rootCauses: [
    { type: 'PRIMARY', description: 'Rigging was not properly balanced - load center of gravity was not correctly identified' },
    { type: 'CONTRIBUTING', description: 'Pre-lift inspection checklist not fully completed' },
    { type: 'CONTRIBUTING', description: 'Recent maintenance on rigging equipment may have affected balance' },
  ],
  investigation: {
    status: 'COMPLETED',
    investigator: 'Sarah Williams',
    startDate: '2026-01-25',
    completedDate: '2026-01-28',
    findings: 'Investigation determined that the primary cause was improper load balancing due to incorrect center of gravity estimation. Contributing factors included incomplete pre-lift inspection and recent rigging maintenance. No equipment defects were found.',
    recommendations: [
      'Implement mandatory two-person verification for load center of gravity calculations',
      'Update pre-lift checklist to include explicit balance verification step',
      'Require post-maintenance verification lift before returning rigging to service',
      'Enhance pedestrian pathway marking and visibility in crane operation zones',
    ],
  },
  capas: [
    {
      id: 'CAPA-2026-0021',
      title: 'Implement dual verification for load calculations',
      type: 'CORRECTIVE',
      status: 'IN_PROGRESS',
      dueDate: '2026-02-15',
      assignee: 'Operations Manager',
      progress: 60,
    },
    {
      id: 'CAPA-2026-0022',
      title: 'Update pre-lift inspection checklist',
      type: 'CORRECTIVE',
      status: 'COMPLETED',
      dueDate: '2026-02-01',
      assignee: 'Safety Team',
      completedDate: '2026-01-30',
      progress: 100,
    },
    {
      id: 'CAPA-2026-0023',
      title: 'Post-maintenance verification procedure',
      type: 'PREVENTIVE',
      status: 'NOT_STARTED',
      dueDate: '2026-02-20',
      assignee: 'Maintenance Manager',
      progress: 0,
    },
  ],
  attachments: [
    { id: 1, name: 'Scene_Photo_1.jpg', type: 'image', size: '2.4 MB', uploadedBy: 'Tom Brown', uploadedDate: '2026-01-25' },
    { id: 2, name: 'Scene_Photo_2.jpg', type: 'image', size: '2.1 MB', uploadedBy: 'Tom Brown', uploadedDate: '2026-01-25' },
    { id: 3, name: 'Rigging_Inspection_Report.pdf', type: 'pdf', size: '1.2 MB', uploadedBy: 'Sarah Williams', uploadedDate: '2026-01-26' },
    { id: 4, name: 'Investigation_Report.pdf', type: 'pdf', size: '850 KB', uploadedBy: 'Sarah Williams', uploadedDate: '2026-01-28' },
  ],
  timeline: [
    { date: '2026-01-25 10:45', event: 'Incident occurred', user: 'System', type: 'incident' },
    { date: '2026-01-25 10:52', event: 'Incident reported', user: 'Tom Brown', type: 'report' },
    { date: '2026-01-25 11:15', event: 'Investigation assigned to Sarah Williams', user: 'Safety Manager', type: 'assign' },
    { date: '2026-01-25 11:30', event: 'Scene photos uploaded', user: 'Tom Brown', type: 'attachment' },
    { date: '2026-01-25 14:00', event: 'Witness interviews conducted', user: 'Sarah Williams', type: 'investigation' },
    { date: '2026-01-26 09:00', event: 'Rigging inspection report attached', user: 'Sarah Williams', type: 'attachment' },
    { date: '2026-01-28 16:00', event: 'Investigation completed', user: 'Sarah Williams', type: 'investigation' },
    { date: '2026-01-28 16:30', event: 'CAPAs assigned', user: 'Sarah Williams', type: 'capa' },
    { date: '2026-01-30 14:00', event: 'CAPA-2026-0022 completed', user: 'Safety Team', type: 'capa' },
  ],
  comments: [
    { id: 1, user: 'Sarah Williams', date: '2026-01-26 10:30', text: 'Initial investigation suggests rigging issue. Will conduct full root cause analysis.' },
    { id: 2, user: 'Tom Brown', date: '2026-01-26 14:15', text: 'Confirmed the rigging was last serviced on Jan 20th. Maintenance records attached.' },
    { id: 3, user: 'Operations Manager', date: '2026-01-28 17:00', text: 'Approved proposed corrective actions. Will implement dual verification immediately.' },
  ],
};

const statusSteps = ['Reported', 'Investigating', 'CAPA Assigned', 'Closed'];

function getStatusStep(status) {
  switch (status) {
    case 'DRAFT': return 0;
    case 'REPORTED': return 0;
    case 'INVESTIGATING': return 1;
    case 'CAPA_ASSIGNED': return 2;
    case 'CLOSED': return 3;
    default: return 0;
  }
}

function getTypeColor(type) {
  switch (type) {
    case 'NEAR_MISS': return 'warning';
    case 'FIRST_AID': return 'info';
    case 'RECORDABLE': case 'LOST_TIME': return 'error';
    default: return 'default';
  }
}

function getSeverityColor(severity) {
  switch (severity) {
    case 'CRITICAL': case 'HIGH': return 'error';
    case 'MEDIUM': return 'warning';
    case 'LOW': return 'info';
    default: return 'default';
  }
}

function getCAPAStatusColor(status) {
  switch (status) {
    case 'COMPLETED': return 'success';
    case 'IN_PROGRESS': return 'primary';
    case 'NOT_STARTED': return 'default';
    case 'OVERDUE': return 'error';
    default: return 'default';
  }
}

function getTimelineColor(type) {
  switch (type) {
    case 'incident': return 'error';
    case 'report': return 'warning';
    case 'investigation': return 'info';
    case 'capa': return 'success';
    case 'attachment': return 'grey';
    default: return 'grey';
  }
}

export default function IncidentDetailPage() {
  const navigate = useNavigate();
  const { incidentId } = useParams();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [addCAPAOpen, setAddCAPAOpen] = useState(false);

  useEffect(() => {
    // Simulate API call
    setLoading(true);
    setTimeout(() => {
      setIncident(mockIncidentDetail);
      setLoading(false);
    }, 500);
  }, [incidentId]);

  const handleAddComment = () => {
    if (newComment.trim()) {
      // Would call API
      setNewComment('');
    }
  };

  if (loading || !incident) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <IconButton onClick={() => navigate('/safety/incidents')} size="small">
              <BackIcon />
            </IconButton>
            <Typography variant="h4" fontWeight={700}>
              {incident.id}
            </Typography>
            <Chip label={incident.type.replace('_', ' ')} color={getTypeColor(incident.type)} />
            <Chip label={incident.severity} color={getSeverityColor(incident.severity)} variant="outlined" />
          </Stack>
          <Typography variant="h6" sx={{ ml: 5 }}>
            {incident.title}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<PrintIcon />}>Print</Button>
          <Button variant="outlined" startIcon={<ShareIcon />}>Share</Button>
          <Button variant="contained" startIcon={<EditIcon />}>Edit</Button>
        </Stack>
      </Stack>

      {/* Status Stepper */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stepper activeStep={getStatusStep(incident.status)} alternativeLabel>
          {statusSteps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Left Column - Details */}
        <Grid item xs={12} md={8}>
          {/* Tabs */}
          <Paper sx={{ mb: 3 }}>
            <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tab label="Details" />
              <Tab label="Investigation" />
              <Tab label="CAPAs" />
              <Tab label="Attachments" />
              <Tab label="Timeline" />
            </Tabs>

            <Box sx={{ p: 2 }}>
              {/* Details Tab */}
              {tabValue === 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Description
                    </Typography>
                    <Typography variant="body1">
                      {incident.description}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Stack spacing={2}>
                      <Box>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                          <LocationIcon fontSize="small" color="action" />
                          <Typography variant="subtitle2" color="text.secondary">Location</Typography>
                        </Stack>
                        <Typography>{incident.location}</Typography>
                      </Box>
                      <Box>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                          <TimeIcon fontSize="small" color="action" />
                          <Typography variant="subtitle2" color="text.secondary">Date & Time</Typography>
                        </Stack>
                        <Typography>{incident.incidentDate} at {incident.incidentTime}</Typography>
                      </Box>
                    </Stack>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Stack spacing={2}>
                      <Box>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                          <PersonIcon fontSize="small" color="action" />
                          <Typography variant="subtitle2" color="text.secondary">Reported By</Typography>
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Avatar sx={{ width: 24, height: 24, fontSize: '0.8rem' }}>
                            {incident.reportedBy.name.charAt(0)}
                          </Avatar>
                          <Typography>{incident.reportedBy.name}</Typography>
                        </Stack>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>Department / Shift</Typography>
                        <Typography>{incident.department} - {incident.shift}</Typography>
                      </Box>
                    </Stack>
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Immediate Actions Taken
                    </Typography>
                    <List dense>
                      {incident.immediateActions.map((action, index) => (
                        <ListItem key={index}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <CheckIcon fontSize="small" color="success" />
                          </ListItemIcon>
                          <ListItemText primary={action} />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>

                  {incident.witnesses.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Witnesses
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {incident.witnesses.map((witness) => (
                          <Chip
                            key={witness.id}
                            avatar={<Avatar>{witness.name.charAt(0)}</Avatar>}
                            label={`${witness.name} (${witness.role})`}
                            variant="outlined"
                          />
                        ))}
                      </Stack>
                    </Grid>
                  )}
                </Grid>
              )}

              {/* Investigation Tab */}
              {tabValue === 1 && (
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <InvestigateIcon color="info" />
                      <Typography variant="h6">Investigation</Typography>
                      <Chip
                        label={incident.investigation.status}
                        size="small"
                        color={incident.investigation.status === 'COMPLETED' ? 'success' : 'warning'}
                      />
                    </Stack>
                  </Stack>

                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2" color="text.secondary">Investigator</Typography>
                      <Typography>{incident.investigation.investigator}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2" color="text.secondary">Started</Typography>
                      <Typography>{incident.investigation.startDate}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2" color="text.secondary">Completed</Typography>
                      <Typography>{incident.investigation.completedDate || '-'}</Typography>
                    </Grid>
                  </Grid>

                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Root Causes
                  </Typography>
                  <List sx={{ mb: 2 }}>
                    {incident.rootCauses.map((cause, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <Chip
                            label={cause.type}
                            size="small"
                            color={cause.type === 'PRIMARY' ? 'error' : 'warning'}
                          />
                        </ListItemIcon>
                        <ListItemText primary={cause.description} />
                      </ListItem>
                    ))}
                  </List>

                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Findings
                  </Typography>
                  <Typography sx={{ mb: 2 }}>{incident.investigation.findings}</Typography>

                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Recommendations
                  </Typography>
                  <List>
                    {incident.investigation.recommendations.map((rec, index) => (
                      <ListItem key={index}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <FlagIcon fontSize="small" color="primary" />
                        </ListItemIcon>
                        <ListItemText primary={rec} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* CAPAs Tab */}
              {tabValue === 2 && (
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="h6">Corrective & Preventive Actions</Typography>
                    <Button startIcon={<AddIcon />} variant="outlined" onClick={() => setAddCAPAOpen(true)}>
                      Add CAPA
                    </Button>
                  </Stack>

                  <Stack spacing={2}>
                    {incident.capas.map((capa) => (
                      <Card key={capa.id} variant="outlined">
                        <CardContent>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                            <Box>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Typography variant="subtitle1" fontWeight={600}>
                                  {capa.id}
                                </Typography>
                                <Chip
                                  label={capa.type}
                                  size="small"
                                  color={capa.type === 'CORRECTIVE' ? 'error' : 'info'}
                                  variant="outlined"
                                />
                                <Chip
                                  label={capa.status.replace('_', ' ')}
                                  size="small"
                                  color={getCAPAStatusColor(capa.status)}
                                />
                              </Stack>
                              <Typography sx={{ mt: 1 }}>{capa.title}</Typography>
                            </Box>
                          </Stack>

                          <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={4}>
                              <Typography variant="caption" color="text.secondary">Assignee</Typography>
                              <Typography variant="body2">{capa.assignee}</Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="caption" color="text.secondary">Due Date</Typography>
                              <Typography variant="body2">{capa.dueDate}</Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="caption" color="text.secondary">Progress</Typography>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <LinearProgress
                                  variant="determinate"
                                  value={capa.progress}
                                  sx={{ flex: 1, height: 8, borderRadius: 4 }}
                                  color={capa.progress === 100 ? 'success' : 'primary'}
                                />
                                <Typography variant="body2">{capa.progress}%</Typography>
                              </Stack>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Attachments Tab */}
              {tabValue === 3 && (
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="h6">Attachments ({incident.attachments.length})</Typography>
                    <Button startIcon={<AttachIcon />} variant="outlined">
                      Add Attachment
                    </Button>
                  </Stack>

                  <List>
                    {incident.attachments.map((attachment) => (
                      <ListItem
                        key={attachment.id}
                        secondaryAction={
                          <Button size="small">Download</Button>
                        }
                      >
                        <ListItemIcon>
                          <AttachIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={attachment.name}
                          secondary={`${attachment.size} • Uploaded by ${attachment.uploadedBy} on ${attachment.uploadedDate}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Timeline Tab */}
              {tabValue === 4 && (
                <Box>
                  <Typography variant="h6" sx={{ mb: 2 }}>Activity Timeline</Typography>
                  <Timeline position="alternate">
                    {incident.timeline.map((event, index) => (
                      <TimelineItem key={index}>
                        <TimelineOppositeContent color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                          {event.date}
                        </TimelineOppositeContent>
                        <TimelineSeparator>
                          <TimelineDot color={getTimelineColor(event.type)} />
                          {index < incident.timeline.length - 1 && <TimelineConnector />}
                        </TimelineSeparator>
                        <TimelineContent>
                          <Typography variant="body2" fontWeight={500}>
                            {event.event}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            by {event.user}
                          </Typography>
                        </TimelineContent>
                      </TimelineItem>
                    ))}
                  </Timeline>
                </Box>
              )}
            </Box>
          </Paper>

          {/* Comments Section */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Comments ({incident.comments.length})
            </Typography>

            <Stack spacing={2} sx={{ mb: 2 }}>
              {incident.comments.map((comment) => (
                <Box key={comment.id}>
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                      {comment.user.charAt(0)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="subtitle2">{comment.user}</Typography>
                        <Typography variant="caption" color="text.secondary">{comment.date}</Typography>
                      </Stack>
                      <Typography variant="body2">{comment.text}</Typography>
                    </Box>
                  </Stack>
                </Box>
              ))}
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Stack direction="row" spacing={1}>
              <TextField
                fullWidth
                size="small"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <Button variant="contained" onClick={handleAddComment} disabled={!newComment.trim()}>
                Post
              </Button>
            </Stack>
          </Paper>
        </Grid>

        {/* Right Column - Summary & Actions */}
        <Grid item xs={12} md={4}>
          {/* Assignee Card */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Assigned To
            </Typography>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ width: 48, height: 48 }}>
                {incident.assignee.name.charAt(0)}
              </Avatar>
              <Box>
                <Typography fontWeight={600}>{incident.assignee.name}</Typography>
                <Typography variant="body2" color="text.secondary">{incident.assignee.role}</Typography>
              </Box>
            </Stack>
            <Button fullWidth variant="outlined" sx={{ mt: 2 }}>
              Reassign
            </Button>
          </Paper>

          {/* Quick Actions */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Actions
            </Typography>
            <Stack spacing={1}>
              {incident.status !== 'CLOSED' && (
                <>
                  <Button fullWidth variant="outlined" startIcon={<InvestigateIcon />}>
                    Update Investigation
                  </Button>
                  <Button fullWidth variant="outlined" startIcon={<CAPAIcon />}>
                    Add CAPA
                  </Button>
                  <Button fullWidth variant="contained" color="success" startIcon={<VerifiedIcon />}>
                    Close Incident
                  </Button>
                </>
              )}
            </Stack>
          </Paper>

          {/* Related Info */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Related Information
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText
                  primary="Similar Incidents"
                  secondary="2 similar incidents in last 12 months"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Equipment"
                  secondary="Overhead Crane Bay 3 (CR-003)"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Last Inspection"
                  secondary="Monthly crane inspection - Jan 15, 2026"
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Add CAPA Dialog */}
      <Dialog open={addCAPAOpen} onClose={() => setAddCAPAOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Corrective/Preventive Action</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select label="Type" defaultValue="CORRECTIVE">
                <MenuItem value="CORRECTIVE">Corrective Action</MenuItem>
                <MenuItem value="PREVENTIVE">Preventive Action</MenuItem>
              </Select>
            </FormControl>
            <TextField fullWidth label="Title" required />
            <TextField fullWidth label="Description" multiline rows={3} />
            <TextField fullWidth label="Assignee" />
            <TextField fullWidth label="Due Date" type="date" InputLabelProps={{ shrink: true }} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddCAPAOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setAddCAPAOpen(false)}>Add CAPA</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
