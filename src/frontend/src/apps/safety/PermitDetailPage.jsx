/**
 * Permit Detail Page
 * View and manage individual permit details
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
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Print as PrintIcon,
  Lock as LotoIcon,
  Whatshot as HotWorkIcon,
  CheckCircle as CheckIcon,
  Cancel as CloseIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Warning as WarningIcon,
  Build as EquipmentIcon,
  VerifiedUser as VerifiedIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  Check as ApproveIcon,
  Close as RejectIcon,
} from '@mui/icons-material';

// Mock permit detail
const mockPermitDetail = {
  id: 'LOTO-2026-0089',
  type: 'LOTO',
  title: 'Shear Line #2 Maintenance',
  description: 'Performing preventive maintenance on hydraulic system and blade replacement. All energy sources must be isolated and locked out during work.',
  equipment: 'Shear Line #2',
  equipmentId: 'EQ-SL-002',
  location: 'Production Floor - Bay 2',
  requestedBy: {
    id: 'EMP-001',
    name: 'Tom Brown',
    role: 'Maintenance Supervisor',
  },
  requestedDate: '2026-02-03 08:00',
  issuedTo: 'Maintenance Team',
  workers: [
    { id: 'EMP-002', name: 'Chris Wilson', role: 'Maintenance Tech' },
    { id: 'EMP-003', name: 'Mike Johnson', role: 'Maintenance Tech' },
    { id: 'EMP-004', name: 'Amy Chen', role: 'Electrician' },
  ],
  validFrom: '2026-02-03 09:00',
  validUntil: '2026-02-03 17:00',
  status: 'ACTIVE',
  approvedBy: {
    id: 'EMP-005',
    name: 'Sarah Williams',
    role: 'Safety Manager',
  },
  approvedDate: '2026-02-03 08:30',
  closedBy: null,
  closedDate: null,
  energySources: [
    { type: 'Electrical', location: 'MCC Panel 3, Breaker 12', isolationMethod: 'Breaker locked in OFF position', verified: true },
    { type: 'Hydraulic', location: 'Main hydraulic valve HV-23', isolationMethod: 'Valve locked closed, pressure bled', verified: true },
    { type: 'Pneumatic', location: 'Air supply valve AV-15', isolationMethod: 'Valve locked closed, lines vented', verified: true },
    { type: 'Mechanical', location: 'Blade assembly', isolationMethod: 'Blade lowered and blocked', verified: true },
  ],
  hazards: [
    'Moving machine parts',
    'Stored hydraulic energy',
    'Sharp blade edges',
    'Electrical shock hazard',
  ],
  precautions: [
    'All workers must apply personal locks',
    'Verify zero energy state before starting work',
    'Use cut-resistant gloves when handling blades',
    'Arc flash PPE required at MCC panel',
  ],
  ppeRequired: ['Safety glasses', 'Steel toe boots', 'Cut-resistant gloves', 'Arc flash suit (at MCC)'],
  locks: [
    { lockNumber: 'L-234', worker: 'Chris Wilson', applied: '2026-02-03 09:05', removed: null },
    { lockNumber: 'L-235', worker: 'Mike Johnson', applied: '2026-02-03 09:08', removed: null },
    { lockNumber: 'L-236', worker: 'Amy Chen', applied: '2026-02-03 09:10', removed: null },
  ],
  timeline: [
    { date: '2026-02-03 08:00', event: 'Permit requested', user: 'Tom Brown' },
    { date: '2026-02-03 08:30', event: 'Permit approved', user: 'Sarah Williams' },
    { date: '2026-02-03 09:00', event: 'Permit activated - work started', user: 'Tom Brown' },
    { date: '2026-02-03 09:05', event: 'Lock L-234 applied', user: 'Chris Wilson' },
    { date: '2026-02-03 09:08', event: 'Lock L-235 applied', user: 'Mike Johnson' },
    { date: '2026-02-03 09:10', event: 'Lock L-236 applied', user: 'Amy Chen' },
    { date: '2026-02-03 09:15', event: 'Zero energy verification completed', user: 'Tom Brown' },
  ],
};

const statusSteps = ['Requested', 'Approved', 'Active', 'Closed'];

function getStatusStep(status) {
  switch (status) {
    case 'PENDING': return 0;
    case 'APPROVED': return 1;
    case 'ACTIVE': return 2;
    case 'CLOSED': case 'EXPIRED': return 3;
    default: return 0;
  }
}

function getTypeColor(type) {
  switch (type) {
    case 'LOTO': return 'warning';
    case 'HOT_WORK': return 'error';
    case 'CONFINED_SPACE': return 'info';
    default: return 'primary';
  }
}

function getStatusColor(status) {
  switch (status) {
    case 'ACTIVE': return 'success';
    case 'PENDING': return 'warning';
    case 'APPROVED': return 'info';
    case 'CLOSED': return 'default';
    case 'EXPIRED': case 'REJECTED': return 'error';
    default: return 'default';
  }
}

export default function PermitDetailPage() {
  const navigate = useNavigate();
  const { permitId } = useParams();
  const [permit, setPermit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [closeNotes, setCloseNotes] = useState('');
  const [locksRemoved, setLocksRemoved] = useState({});

  useEffect(() => {
    // Simulate API call
    setLoading(true);
    setTimeout(() => {
      setPermit(mockPermitDetail);
      setLoading(false);
    }, 500);
  }, [permitId]);

  const handleClosePermit = () => {
    setPermit({
      ...permit,
      status: 'CLOSED',
      closedBy: { name: 'Current User', role: 'Maintenance Supervisor' },
      closedDate: new Date().toISOString(),
    });
    setCloseDialogOpen(false);
  };

  if (loading || !permit) {
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
            <IconButton onClick={() => navigate('/safety/permits')} size="small">
              <BackIcon />
            </IconButton>
            <Typography variant="h4" fontWeight={700}>
              {permit.id}
            </Typography>
            <Chip 
              icon={permit.type === 'LOTO' ? <LotoIcon /> : <HotWorkIcon />}
              label={permit.type.replace('_', ' ')} 
              color={getTypeColor(permit.type)} 
            />
            <Chip label={permit.status} color={getStatusColor(permit.status)} />
          </Stack>
          <Typography variant="h6" sx={{ ml: 5 }}>
            {permit.title}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<PrintIcon />}>Print</Button>
          {permit.status === 'ACTIVE' && (
            <Button 
              variant="contained" 
              color="error"
              startIcon={<CloseIcon />}
              onClick={() => setCloseDialogOpen(true)}
            >
              Close Permit
            </Button>
          )}
          {permit.status === 'PENDING' && (
            <>
              <Button variant="contained" color="success" startIcon={<ApproveIcon />}>
                Approve
              </Button>
              <Button variant="outlined" color="error" startIcon={<RejectIcon />}>
                Reject
              </Button>
            </>
          )}
        </Stack>
      </Stack>

      {/* Status Alert */}
      {permit.status === 'ACTIVE' && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <strong>ACTIVE PERMIT</strong> - This equipment is currently locked out. 
          Valid until {permit.validUntil}. Ensure all locks are removed before closing this permit.
        </Alert>
      )}

      {/* Status Stepper */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stepper activeStep={getStatusStep(permit.status)} alternativeLabel>
          {statusSteps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={8}>
          {/* Description */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Work Description</Typography>
            <Typography>{permit.description}</Typography>
          </Paper>

          {/* Energy Sources (LOTO specific) */}
          {permit.type === 'LOTO' && (
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>Energy Sources & Isolation Points</Typography>
              <List>
                {permit.energySources.map((source, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      {source.verified ? (
                        <CheckIcon color="success" />
                      ) : (
                        <WarningIcon color="warning" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography fontWeight={600}>{source.type}</Typography>
                          <Chip 
                            label={source.verified ? 'Verified' : 'Not Verified'} 
                            size="small" 
                            color={source.verified ? 'success' : 'warning'}
                          />
                        </Stack>
                      }
                      secondary={
                        <>
                          <Typography variant="body2">Location: {source.location}</Typography>
                          <Typography variant="body2">Method: {source.isolationMethod}</Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}

          {/* Locks Applied */}
          {permit.type === 'LOTO' && (
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>Locks Applied</Typography>
              <List>
                {permit.locks.map((lock, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: lock.removed ? 'grey.300' : 'warning.main', width: 32, height: 32 }}>
                        <LotoIcon fontSize="small" />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={`Lock ${lock.lockNumber} - ${lock.worker}`}
                      secondary={`Applied: ${lock.applied}${lock.removed ? ` | Removed: ${lock.removed}` : ''}`}
                    />
                    <Chip 
                      label={lock.removed ? 'Removed' : 'Active'} 
                      size="small" 
                      color={lock.removed ? 'default' : 'success'}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}

          {/* Hazards & Precautions */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Identified Hazards
                </Typography>
                <List dense>
                  {permit.hazards.map((hazard, index) => (
                    <ListItem key={index}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <WarningIcon fontSize="small" color="error" />
                      </ListItemIcon>
                      <ListItemText primary={hazard} />
                    </ListItem>
                  ))}
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Safety Precautions
                </Typography>
                <List dense>
                  {permit.precautions.map((precaution, index) => (
                    <ListItem key={index}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckIcon fontSize="small" color="success" />
                      </ListItemIcon>
                      <ListItemText primary={precaution} />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>
          </Paper>

          {/* Timeline */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Activity Timeline</Typography>
            <List dense>
              {permit.timeline.map((event, index) => (
                <ListItem key={index}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <HistoryIcon fontSize="small" color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary={event.event}
                    secondary={`${event.date} by ${event.user}`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={4}>
          {/* Permit Details */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Permit Details
            </Typography>
            <List dense>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <EquipmentIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary="Equipment" 
                  secondary={`${permit.equipment} (${permit.equipmentId})`} 
                />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <LocationIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Location" secondary={permit.location} />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <TimeIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary="Valid Period" 
                  secondary={`${permit.validFrom} to ${permit.validUntil}`} 
                />
              </ListItem>
            </List>
          </Paper>

          {/* Requested By */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Requested By
            </Typography>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar>{permit.requestedBy.name.charAt(0)}</Avatar>
              <Box>
                <Typography fontWeight={600}>{permit.requestedBy.name}</Typography>
                <Typography variant="body2" color="text.secondary">{permit.requestedBy.role}</Typography>
                <Typography variant="caption" color="text.secondary">{permit.requestedDate}</Typography>
              </Box>
            </Stack>
          </Paper>

          {/* Approved By */}
          {permit.approvedBy && (
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Approved By
              </Typography>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <VerifiedIcon />
                </Avatar>
                <Box>
                  <Typography fontWeight={600}>{permit.approvedBy.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{permit.approvedBy.role}</Typography>
                  <Typography variant="caption" color="text.secondary">{permit.approvedDate}</Typography>
                </Box>
              </Stack>
            </Paper>
          )}

          {/* Workers */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Authorized Workers ({permit.workers.length})
            </Typography>
            <List dense>
              {permit.workers.map((worker) => (
                <ListItem key={worker.id} sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Avatar sx={{ width: 28, height: 28, fontSize: '0.8rem' }}>
                      {worker.name.charAt(0)}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText 
                    primary={worker.name} 
                    secondary={worker.role}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>

          {/* PPE Required */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Required PPE
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {permit.ppeRequired.map((ppe, index) => (
                <Chip key={index} label={ppe} size="small" variant="outlined" />
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Close Permit Dialog */}
      <Dialog open={closeDialogOpen} onClose={() => setCloseDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Close Permit</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Ensure all work is complete and all personal locks have been removed before closing this permit.
          </Alert>
          
          <Typography variant="subtitle2" gutterBottom>
            Confirm Lock Removal
          </Typography>
          {permit.locks.map((lock, index) => (
            <FormControlLabel
              key={index}
              control={
                <Checkbox
                  checked={locksRemoved[lock.lockNumber] || false}
                  onChange={(e) => setLocksRemoved({ ...locksRemoved, [lock.lockNumber]: e.target.checked })}
                />
              }
              label={`Lock ${lock.lockNumber} (${lock.worker}) removed`}
            />
          ))}

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Closing Notes"
            value={closeNotes}
            onChange={(e) => setCloseNotes(e.target.value)}
            placeholder="Any notes about work completed, issues encountered, etc."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCloseDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={handleClosePermit}
            disabled={Object.values(locksRemoved).filter(Boolean).length !== permit.locks.length}
          >
            Close Permit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
