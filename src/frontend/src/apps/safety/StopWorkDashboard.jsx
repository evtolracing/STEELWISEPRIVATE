/**
 * Stop-Work Authority (SWA) Dashboard
 * 
 * Central hub for managing all stop-work events, clearances, and safety blocks.
 * Integrates with dispatch engine to show blocked resources.
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  AlertTitle,
  Tabs,
  Tab,
  LinearProgress,
  Tooltip,
  Divider,
  Stack,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Badge,
  Avatar,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  PriorityHigh as CriticalIcon,
  PlayArrow as ResumeIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  Build as AssetIcon,
  LocationOn as LocationIcon,
  Work as WorkIcon,
  Factory as FactoryIcon,
  Assessment as StatsIcon,
  Timeline as TimelineIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Security as SecurityIcon,
  Error as ErrorIcon,
  InfoOutlined as InfoIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

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

// Scope type icons
const scopeIcons = {
  JOB: WorkIcon,
  WORK_CENTER: FactoryIcon,
  ASSET: AssetIcon,
  AREA: LocationIcon,
  LOCATION: LocationIcon,
  OPERATION: AssignmentIcon,
};

// Mock data for initial development
const mockEvents = [
  {
    id: 'swa-001',
    eventNumber: 'SWA-2024-001',
    scopeType: 'WORK_CENTER',
    scopeId: 'WC-SAW-001',
    scopeDescription: 'Saw Line 1',
    reasonCode: 'MISSING_LOTO_PERMIT',
    severity: 'CRITICAL',
    status: 'ACTIVE',
    description: 'LOTO permit not in place for maintenance work',
    initiatedBy: 'John Smith',
    initiatedByRole: 'OPERATOR',
    initiatedAt: dayjs().subtract(2, 'hour').toISOString(),
    affectedJobs: ['JOB-001', 'JOB-002'],
  },
  {
    id: 'swa-002',
    eventNumber: 'SWA-2024-002',
    scopeType: 'ASSET',
    scopeId: 'ASSET-CRANE-001',
    scopeDescription: 'Overhead Crane Bay 3',
    reasonCode: 'OVERDUE_INSPECTION',
    severity: 'HIGH',
    status: 'MITIGATION_IN_PROGRESS',
    description: 'Annual safety inspection overdue by 15 days',
    initiatedBy: 'Safety System',
    initiatedByRole: 'SYSTEM_AUTO',
    initiatedAt: dayjs().subtract(1, 'day').toISOString(),
    affectedJobs: ['JOB-003'],
  },
  {
    id: 'swa-003',
    eventNumber: 'SWA-2024-003',
    scopeType: 'JOB',
    scopeId: 'JOB-004',
    scopeDescription: 'Job #10045 - Custom Steel Plates',
    reasonCode: 'OPERATOR_TRAINING_EXPIRED',
    severity: 'MEDIUM',
    status: 'PENDING_VERIFICATION',
    description: 'Assigned operator training certification expired',
    initiatedBy: 'AI Safety Assistant',
    initiatedByRole: 'SAFETY_AI_ASSISTANT',
    initiatedAt: dayjs().subtract(4, 'hour').toISOString(),
    affectedJobs: [],
  },
];

const mockStats = {
  active: 2,
  cleared30Days: 15,
  total30Days: 17,
  avgResolutionHours: '4.2',
  bySeverity: {
    CRITICAL: 1,
    HIGH: 1,
    MEDIUM: 0,
    LOW: 0,
  },
  byReasonCode: {
    MISSING_LOTO_PERMIT: 5,
    OVERDUE_INSPECTION: 4,
    OPERATOR_TRAINING_EXPIRED: 3,
    GUARD_BYPASSED: 2,
    EQUIPMENT_MALFUNCTION: 3,
  },
};

const mockBlockedResources = {
  workCenters: [
    { id: 'WC-SAW-001', name: 'Saw Line 1', reason: 'MISSING_LOTO_PERMIT', swaId: 'swa-001' },
  ],
  assets: [
    { id: 'ASSET-CRANE-001', name: 'Overhead Crane Bay 3', reason: 'OVERDUE_INSPECTION', swaId: 'swa-002' },
  ],
  jobs: [
    { id: 'JOB-001', name: 'Order #10042', reason: 'WORK_CENTER_BLOCKED', swaId: 'swa-001' },
    { id: 'JOB-002', name: 'Order #10043', reason: 'WORK_CENTER_BLOCKED', swaId: 'swa-001' },
    { id: 'JOB-004', name: 'Order #10045', reason: 'OPERATOR_TRAINING_EXPIRED', swaId: 'swa-003' },
  ],
  operators: [],
};

export default function StopWorkDashboard() {
  const navigate = useNavigate();
  const [events, setEvents] = useState(mockEvents);
  const [stats, setStats] = useState(mockStats);
  const [blockedResources, setBlockedResources] = useState(mockBlockedResources);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [initiateDialogOpen, setInitiateDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Initiate SWA form state
  const [newSWA, setNewSWA] = useState({
    scopeType: 'WORK_CENTER',
    scopeId: '',
    reasonCode: '',
    severity: 'HIGH',
    description: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API calls
      // const [eventsRes, statsRes, blockedRes] = await Promise.all([
      //   fetch('/api/safety/stop-work/active'),
      //   fetch('/api/safety/stop-work/stats/summary'),
      //   fetch('/api/safety/stop-work/blocked-resources'),
      // ]);
      // setEvents(await eventsRes.json());
      // setStats(await statsRes.json());
      // setBlockedResources(await blockedRes.json());
    } catch (error) {
      console.error('Error fetching SWA data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInitiateSWA = async () => {
    try {
      // TODO: Replace with actual API call
      // await fetch('/api/safety/stop-work', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(newSWA),
      // });
      
      // Mock: Add to local state
      const mockNewEvent = {
        id: `swa-${Date.now()}`,
        eventNumber: `SWA-2024-${Math.floor(Math.random() * 1000)}`,
        ...newSWA,
        scopeDescription: newSWA.scopeId,
        status: 'ACTIVE',
        initiatedBy: 'Current User',
        initiatedByRole: 'OPERATOR',
        initiatedAt: new Date().toISOString(),
        affectedJobs: [],
      };
      setEvents([mockNewEvent, ...events]);
      setInitiateDialogOpen(false);
      setNewSWA({
        scopeType: 'WORK_CENTER',
        scopeId: '',
        reasonCode: '',
        severity: 'HIGH',
        description: '',
      });
    } catch (error) {
      console.error('Error initiating SWA:', error);
    }
  };

  const openEventDetails = (event) => {
    setSelectedEvent(event);
    setDetailDialogOpen(true);
  };

  const activeEvents = events.filter(e => e.status !== 'CLEARED');

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SecurityIcon fontSize="large" color="error" />
            Stop-Work Authority
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage safety stop-work events, clearances, and blocked resources
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchData}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<AddIcon />}
            onClick={() => setInitiateDialogOpen(true)}
          >
            Initiate Stop-Work
          </Button>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Active Alerts Banner */}
      {activeEvents.length > 0 && (
        <Alert
          severity="error"
          icon={<BlockIcon />}
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => setActiveTab(0)}>
              View All
            </Button>
          }
        >
          <AlertTitle>
            {activeEvents.length} Active Stop-Work Event{activeEvents.length !== 1 ? 's' : ''}
          </AlertTitle>
          Dispatch blocked for: {blockedResources.workCenters.length} work centers, {blockedResources.assets.length} assets, {blockedResources.jobs.length} jobs
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: `4px solid ${severityColors.CRITICAL}` }}>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Active Stop-Works
              </Typography>
              <Typography variant="h3" fontWeight={700} color="error.main">
                {stats.active}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Chip
                  size="small"
                  label={`${stats.bySeverity.CRITICAL} Critical`}
                  sx={{ bgcolor: severityColors.CRITICAL, color: 'white', fontSize: '0.7rem' }}
                />
                <Chip
                  size="small"
                  label={`${stats.bySeverity.HIGH} High`}
                  sx={{ bgcolor: severityColors.HIGH, color: 'white', fontSize: '0.7rem' }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: `4px solid ${severityColors.LOW}` }}>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Cleared (30 Days)
              </Typography>
              <Typography variant="h3" fontWeight={700} color="success.main">
                {stats.cleared30Days}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                of {stats.total30Days} total events
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: '4px solid #2196f3' }}>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Avg. Resolution Time
              </Typography>
              <Typography variant="h3" fontWeight={700} color="primary.main">
                {stats.avgResolutionHours}h
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Target: &lt; 4 hours
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: '4px solid #9c27b0' }}>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Blocked Resources
              </Typography>
              <Typography variant="h3" fontWeight={700} color="secondary.main">
                {blockedResources.workCenters.length + blockedResources.assets.length}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {blockedResources.jobs.length} jobs affected
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab
            icon={<Badge badgeContent={activeEvents.length} color="error"><WarningIcon /></Badge>}
            label="Active Events"
            iconPosition="start"
          />
          <Tab
            icon={<BlockIcon />}
            label="Blocked Resources"
            iconPosition="start"
          />
          <Tab
            icon={<HistoryIcon />}
            label="Event History"
            iconPosition="start"
          />
          <Tab
            icon={<StatsIcon />}
            label="Analytics"
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Active Stop-Work Events
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Event #</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Scope</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Initiated</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activeEvents.map((event) => {
                  const ScopeIcon = scopeIcons[event.scopeType] || WorkIcon;
                  return (
                    <TableRow
                      key={event.id}
                      sx={{
                        bgcolor: event.severity === 'CRITICAL' ? 'error.50' : undefined,
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {event.eventNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={event.severity}
                          sx={{
                            bgcolor: severityColors[event.severity],
                            color: 'white',
                            fontWeight: 600,
                          }}
                          icon={event.severity === 'CRITICAL' ? <CriticalIcon sx={{ color: 'white !important' }} /> : undefined}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 28, height: 28, bgcolor: 'grey.200' }}>
                            <ScopeIcon fontSize="small" color="action" />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {event.scopeDescription}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {event.scopeType}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {event.reasonCode.replace(/_/g, ' ')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={event.status.replace(/_/g, ' ')}
                          sx={{
                            bgcolor: statusColors[event.status] + '20',
                            color: statusColors[event.status],
                            border: `1px solid ${statusColors[event.status]}`,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title={dayjs(event.initiatedAt).format('MMM D, YYYY h:mm A')}>
                          <Typography variant="body2" color="text.secondary">
                            {dayjs(event.initiatedAt).fromNow()}
                          </Typography>
                        </Tooltip>
                        <Typography variant="caption" color="text.secondary">
                          by {event.initiatedBy}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => openEventDetails(event)}>
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Clearance Workflow">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => navigate(`/safety/stop-work/${event.id}`)}
                            >
                              <ArrowForwardIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {activeEvents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                      <Typography variant="h6" color="success.main">
                        No Active Stop-Work Events
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        All systems clear. Operations can proceed normally.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {activeTab === 1 && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FactoryIcon color="error" />
                Blocked Work Centers
              </Typography>
              <List dense>
                {blockedResources.workCenters.map((wc) => (
                  <ListItem key={wc.id} sx={{ bgcolor: 'error.50', borderRadius: 1, mb: 1 }}>
                    <ListItemIcon>
                      <BlockIcon color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary={wc.name}
                      secondary={wc.reason.replace(/_/g, ' ')}
                    />
                    <IconButton size="small" onClick={() => openEventDetails(events.find(e => e.id === wc.swaId))}>
                      <ViewIcon fontSize="small" />
                    </IconButton>
                  </ListItem>
                ))}
                {blockedResources.workCenters.length === 0 && (
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText primary="All work centers operational" />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssetIcon color="warning" />
                Blocked Assets
              </Typography>
              <List dense>
                {blockedResources.assets.map((asset) => (
                  <ListItem key={asset.id} sx={{ bgcolor: 'warning.50', borderRadius: 1, mb: 1 }}>
                    <ListItemIcon>
                      <BlockIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary={asset.name}
                      secondary={asset.reason.replace(/_/g, ' ')}
                    />
                    <IconButton size="small" onClick={() => openEventDetails(events.find(e => e.id === asset.swaId))}>
                      <ViewIcon fontSize="small" />
                    </IconButton>
                  </ListItem>
                ))}
                {blockedResources.assets.length === 0 && (
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText primary="All assets operational" />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WorkIcon color="info" />
                Affected Jobs
              </Typography>
              <List dense>
                {blockedResources.jobs.map((job) => (
                  <ListItem key={job.id} sx={{ bgcolor: 'info.50', borderRadius: 1, mb: 1 }}>
                    <ListItemIcon>
                      <BlockIcon color="info" />
                    </ListItemIcon>
                    <ListItemText
                      primary={job.name}
                      secondary={job.reason.replace(/_/g, ' ')}
                    />
                    <IconButton size="small" onClick={() => openEventDetails(events.find(e => e.id === job.swaId))}>
                      <ViewIcon fontSize="small" />
                    </IconButton>
                  </ListItem>
                ))}
                {blockedResources.jobs.length === 0 && (
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText primary="No jobs blocked" />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Grid>
        </Grid>
      )}

      {activeTab === 2 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Event History (Last 30 Days)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Full audit trail and clearance records
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Event #</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Scope</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Initiated</TableCell>
                  <TableCell>Cleared</TableCell>
                  <TableCell>Duration</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {events.filter(e => e.status === 'CLEARED').map((event) => (
                  <TableRow key={event.id} hover>
                    <TableCell>{event.eventNumber}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={event.severity}
                        sx={{ bgcolor: severityColors[event.severity] + '20', color: severityColors[event.severity] }}
                      />
                    </TableCell>
                    <TableCell>{event.scopeDescription}</TableCell>
                    <TableCell>{event.reasonCode.replace(/_/g, ' ')}</TableCell>
                    <TableCell>{dayjs(event.initiatedAt).format('MMM D, h:mm A')}</TableCell>
                    <TableCell>
                      <Chip size="small" icon={<CheckCircleIcon />} label="Cleared" color="success" variant="outlined" />
                    </TableCell>
                    <TableCell>—</TableCell>
                  </TableRow>
                ))}
                {events.filter(e => e.status === 'CLEARED').length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <InfoIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                      <Typography variant="body1" color="text.secondary">
                        No cleared events in the last 30 days
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {activeTab === 3 && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Events by Reason Code
              </Typography>
              <Stack spacing={1}>
                {Object.entries(stats.byReasonCode).map(([code, count]) => (
                  <Box key={code} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2">{code.replace(/_/g, ' ')}</Typography>
                      <LinearProgress
                        variant="determinate"
                        value={(count / Math.max(...Object.values(stats.byReasonCode))) * 100}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                    <Typography variant="body2" fontWeight={600} sx={{ minWidth: 30 }}>
                      {count}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Key Safety Metrics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Typography variant="h4" fontWeight={700} color="primary.main">
                      {stats.total30Days}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Events (30d)
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Typography variant="h4" fontWeight={700} color="success.main">
                      {((stats.cleared30Days / stats.total30Days) * 100).toFixed(0)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Resolution Rate
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Typography variant="h4" fontWeight={700} color="warning.main">
                      {stats.avgResolutionHours}h
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg Resolution
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Typography variant="h4" fontWeight={700} color="error.main">
                      0
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Override Attempts
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Initiate SWA Dialog */}
      <Dialog open={initiateDialogOpen} onClose={() => setInitiateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
          <WarningIcon />
          Initiate Stop-Work Authority
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <AlertTitle>Stop-Work Authority</AlertTitle>
            This action will immediately block all work on the selected resource. This is a safety-critical action and will be logged.
          </Alert>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Scope Type</InputLabel>
                <Select
                  value={newSWA.scopeType}
                  label="Scope Type"
                  onChange={(e) => setNewSWA({ ...newSWA, scopeType: e.target.value })}
                >
                  <MenuItem value="WORK_CENTER">Work Center</MenuItem>
                  <MenuItem value="ASSET">Asset/Equipment</MenuItem>
                  <MenuItem value="JOB">Job</MenuItem>
                  <MenuItem value="OPERATION">Operation</MenuItem>
                  <MenuItem value="AREA">Area</MenuItem>
                  <MenuItem value="LOCATION">Location</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Scope ID"
                value={newSWA.scopeId}
                onChange={(e) => setNewSWA({ ...newSWA, scopeId: e.target.value })}
                placeholder="e.g., WC-SAW-001"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Reason Code</InputLabel>
                <Select
                  value={newSWA.reasonCode}
                  label="Reason Code"
                  onChange={(e) => setNewSWA({ ...newSWA, reasonCode: e.target.value })}
                >
                  <MenuItem value="MISSING_LOTO_PERMIT">Missing LOTO Permit</MenuItem>
                  <MenuItem value="EXPIRED_LOTO_PERMIT">Expired LOTO Permit</MenuItem>
                  <MenuItem value="MISSING_HOT_WORK_PERMIT">Missing Hot Work Permit</MenuItem>
                  <MenuItem value="GUARD_BYPASSED">Guard Bypassed</MenuItem>
                  <MenuItem value="EQUIPMENT_MALFUNCTION">Equipment Malfunction</MenuItem>
                  <MenuItem value="OVERDUE_INSPECTION">Overdue Inspection</MenuItem>
                  <MenuItem value="OPERATOR_TRAINING_EXPIRED">Operator Training Expired</MenuItem>
                  <MenuItem value="OPERATOR_SAFETY_CONCERN">Operator Safety Concern</MenuItem>
                  <MenuItem value="UNSAFE_WORK_CONDITION">Unsafe Work Condition</MenuItem>
                  <MenuItem value="EHS_DIRECTIVE">EHS Directive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Severity</InputLabel>
                <Select
                  value={newSWA.severity}
                  label="Severity"
                  onChange={(e) => setNewSWA({ ...newSWA, severity: e.target.value })}
                >
                  <MenuItem value="CRITICAL">Critical - Immediate Danger</MenuItem>
                  <MenuItem value="HIGH">High - Serious Hazard</MenuItem>
                  <MenuItem value="MEDIUM">Medium - Compliance Issue</MenuItem>
                  <MenuItem value="LOW">Low - Minor Concern</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={newSWA.description}
                onChange={(e) => setNewSWA({ ...newSWA, description: e.target.value })}
                placeholder="Describe the safety concern..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setInitiateDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<BlockIcon />}
            onClick={handleInitiateSWA}
            disabled={!newSWA.scopeId || !newSWA.reasonCode || !newSWA.description}
          >
            Initiate Stop-Work
          </Button>
        </DialogActions>
      </Dialog>

      {/* Event Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
        {selectedEvent && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WarningIcon color="error" />
              {selectedEvent.eventNumber}
              <Chip
                size="small"
                label={selectedEvent.severity}
                sx={{ ml: 1, bgcolor: severityColors[selectedEvent.severity], color: 'white' }}
              />
              <Chip
                size="small"
                label={selectedEvent.status.replace(/_/g, ' ')}
                sx={{ bgcolor: statusColors[selectedEvent.status] + '20', color: statusColors[selectedEvent.status] }}
              />
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Scope</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedEvent.scopeType}: {selectedEvent.scopeDescription}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Reason</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedEvent.reasonCode.replace(/_/g, ' ')}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                  <Typography variant="body1">{selectedEvent.description}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Initiated By</Typography>
                  <Typography variant="body1">
                    {selectedEvent.initiatedBy} ({selectedEvent.initiatedByRole})
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Initiated At</Typography>
                  <Typography variant="body1">
                    {dayjs(selectedEvent.initiatedAt).format('MMM D, YYYY h:mm A')}
                  </Typography>
                </Grid>
                {selectedEvent.affectedJobs?.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Affected Jobs</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                      {selectedEvent.affectedJobs.map((job) => (
                        <Chip key={job} size="small" label={job} icon={<WorkIcon />} />
                      ))}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  setDetailDialogOpen(false);
                  navigate(`/safety/stop-work/${selectedEvent.id}`);
                }}
              >
                Go to Clearance Workflow
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
