/**
 * Safety Dashboard
 * Main EHS dashboard with KPIs, alerts, and quick actions
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  IconButton,
  Stack,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Avatar,
  LinearProgress,
  alpha,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  HealthAndSafety as SafetyIcon,
  Warning as IncidentIcon,
  Assignment as InspectionIcon,
  VerifiedUser as PermitIcon,
  School as TrainingIcon,
  ReportProblem as AlertIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccessTime as ClockIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  LocalHospital as MedicalIcon,
  Construction as WorkIcon,
  Engineering as MaintenanceIcon,
  Notifications as NotificationIcon,
  Speed as DashboardIcon,
  AssignmentTurnedIn as TaskIcon,
  Error as CriticalIcon,
  PanTool as StopWorkIcon,
  Whatshot as HotWorkIcon,
  ElectricalServices as ElectricalIcon,
  Lock as LotoIcon,
} from '@mui/icons-material';

// Mock data - will be replaced with API calls
const mockDashboardData = {
  kpis: {
    daysSinceLastRecordable: 127,
    daysSinceLastIncident: 45,
    trainingCompliance: 94.5,
    inspectionCompletionRate: 97.2,
    openCAPAs: 12,
    overdueCAPAs: 3,
    activePermits: 5,
    pendingPermitApprovals: 2,
  },
  recentIncidents: [
    { id: 'INC-2026-0045', type: 'NEAR_MISS', severity: 'LOW', title: 'Forklift near-miss in aisle 4', date: '2026-02-02', status: 'INVESTIGATING' },
    { id: 'INC-2026-0044', type: 'FIRST_AID', severity: 'LOW', title: 'Minor laceration - sheet metal handling', date: '2026-01-28', status: 'CLOSED' },
    { id: 'INC-2026-0043', type: 'NEAR_MISS', severity: 'MEDIUM', title: 'Crane load shift during lift', date: '2026-01-25', status: 'CAPA_ASSIGNED' },
  ],
  upcomingInspections: [
    { id: 'INS-001', type: 'FORKLIFT_DAILY', equipment: 'Forklift #12', dueDate: '2026-02-03', assignee: 'Mike Johnson' },
    { id: 'INS-002', type: 'CRANE_MONTHLY', equipment: 'Overhead Crane Bay 3', dueDate: '2026-02-05', assignee: 'Sarah Williams' },
    { id: 'INS-003', type: 'FIRE_EXTINGUISHER', equipment: 'Building A', dueDate: '2026-02-10', assignee: 'Safety Team' },
  ],
  overdueItems: [
    { type: 'TRAINING', title: 'LOTO Refresher - 3 employees overdue', count: 3, severity: 'HIGH' },
    { type: 'CAPA', title: 'CAPA-2026-0018 - Machine guarding corrective action', dueDate: '2026-01-28', severity: 'MEDIUM' },
    { type: 'INSPECTION', title: 'Monthly crane inspection - Bay 2', dueDate: '2026-01-30', severity: 'HIGH' },
  ],
  activePermits: [
    { id: 'LOTO-2026-0089', type: 'LOTO', equipment: 'Shear Line #2', issuedTo: 'Tom Brown', validUntil: '2026-02-03 16:00', status: 'ACTIVE' },
    { id: 'HW-2026-0034', type: 'HOT_WORK', location: 'Maintenance Shop', issuedTo: 'Welding Team', validUntil: '2026-02-03 14:00', status: 'ACTIVE' },
  ],
  trainingStatus: {
    fullyTrained: 142,
    dueWithin30Days: 18,
    overdue: 5,
    totalEmployees: 165,
  },
};

// Status color mapping
const getStatusColor = (status) => {
  switch (status) {
    case 'CLOSED': return 'success';
    case 'INVESTIGATING': return 'warning';
    case 'CAPA_ASSIGNED': return 'info';
    case 'DRAFT': return 'default';
    case 'ACTIVE': return 'success';
    case 'PENDING': return 'warning';
    default: return 'default';
  }
};

const getSeverityColor = (severity) => {
  switch (severity) {
    case 'CRITICAL': case 'HIGH': return 'error';
    case 'MEDIUM': return 'warning';
    case 'LOW': return 'info';
    default: return 'default';
  }
};

const getPermitIcon = (type) => {
  switch (type) {
    case 'LOTO': return <LotoIcon />;
    case 'HOT_WORK': return <HotWorkIcon />;
    case 'ELECTRICAL': return <ElectricalIcon />;
    default: return <PermitIcon />;
  }
};

// KPI Card Component
function KpiCard({ title, value, subtitle, icon, color = 'primary', trend, trendValue, onClick }) {
  return (
    <Card 
      sx={{ 
        height: '100%', 
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        '&:hover': onClick ? { transform: 'translateY(-2px)', boxShadow: 4 } : {},
      }}
      onClick={onClick}
    >
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              {title}
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, color: `${color}.main`, my: 0.5 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
                {trend === 'up' ? (
                  <TrendingUpIcon fontSize="small" color="success" />
                ) : (
                  <TrendingDownIcon fontSize="small" color="error" />
                )}
                <Typography variant="caption" color={trend === 'up' ? 'success.main' : 'error.main'}>
                  {trendValue}
                </Typography>
              </Stack>
            )}
          </Box>
          <Avatar sx={{ bgcolor: alpha(color === 'primary' ? '#1976d2' : color === 'success' ? '#2e7d32' : color === 'warning' ? '#ed6c02' : color === 'error' ? '#d32f2f' : '#1976d2', 0.1) }}>
            {icon}
          </Avatar>
        </Stack>
      </CardContent>
    </Card>
  );
}

// Alert Card Component
function AlertCard({ title, items, color = 'warning', icon, onViewAll }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ pb: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Avatar sx={{ bgcolor: `${color}.light`, width: 32, height: 32 }}>
              {icon}
            </Avatar>
            <Typography variant="subtitle1" fontWeight={600}>
              {title}
            </Typography>
          </Stack>
          <Chip label={items.length} size="small" color={color} />
        </Stack>
        
        <List dense sx={{ py: 0 }}>
          {items.slice(0, 3).map((item, index) => (
            <ListItem key={index} sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <CriticalIcon fontSize="small" color={getSeverityColor(item.severity)} />
              </ListItemIcon>
              <ListItemText
                primary={item.title}
                secondary={item.dueDate ? `Due: ${item.dueDate}` : item.count ? `${item.count} items` : null}
                primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
      {onViewAll && (
        <CardActions sx={{ pt: 0 }}>
          <Button size="small" onClick={onViewAll}>View All</Button>
        </CardActions>
      )}
    </Card>
  );
}

export default function SafetyDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(mockDashboardData);
  const [error, setError] = useState(null);

  const handleRefresh = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setData(mockDashboardData);
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    handleRefresh();
  }, []);

  if (loading && !data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Safety Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Environmental Health & Safety Overview
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<IncidentIcon />}
            onClick={() => navigate('/safety/incidents?new=true')}
          >
            Report Incident
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stop-Work Authority Banner - Shows when there are active stop-work events */}
      <Alert
        severity="error"
        icon={<StopWorkIcon />}
        action={
          <Button
            color="inherit"
            size="small"
            onClick={() => navigate('/safety/stop-work')}
          >
            Manage Stop-Work Events
          </Button>
        }
        sx={{
          mb: 3,
          bgcolor: 'error.dark',
          color: 'white',
          '& .MuiAlert-icon': { color: 'white' },
          '& .MuiButton-root': { color: 'white', borderColor: 'white' },
        }}
      >
        <Typography variant="body2" fontWeight={600}>
          2 Active Stop-Work Events — Dispatch blocked for 1 work center, 3 jobs affected
        </Typography>
      </Alert>

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="Days Since Last Recordable"
            value={data.kpis.daysSinceLastRecordable}
            subtitle="Company-wide"
            icon={<SafetyIcon color="success" />}
            color="success"
            trend="up"
            trendValue="Building streak"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="Training Compliance"
            value={`${data.kpis.trainingCompliance}%`}
            subtitle={`${data.trainingStatus.overdue} overdue`}
            icon={<TrainingIcon color="primary" />}
            color={data.trainingStatus.overdue > 0 ? 'warning' : 'success'}
            onClick={() => navigate('/safety/training')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="Inspection Rate"
            value={`${data.kpis.inspectionCompletionRate}%`}
            subtitle="This month"
            icon={<InspectionIcon color="info" />}
            color="info"
            onClick={() => navigate('/safety/inspections')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="Open CAPAs"
            value={data.kpis.openCAPAs}
            subtitle={data.kpis.overdueCAPAs > 0 ? `${data.kpis.overdueCAPAs} overdue` : 'All on track'}
            icon={<TaskIcon color={data.kpis.overdueCAPAs > 0 ? 'error' : 'success'} />}
            color={data.kpis.overdueCAPAs > 0 ? 'error' : 'success'}
            onClick={() => navigate('/safety/capa')}
          />
        </Grid>
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={8}>
          {/* Active Permits */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <PermitIcon color="primary" />
                <Typography variant="h6">Active Permits</Typography>
                <Chip label={data.activePermits.length} size="small" color="primary" />
              </Stack>
              <Stack direction="row" spacing={1}>
                {data.kpis.pendingPermitApprovals > 0 && (
                  <Chip
                    icon={<ScheduleIcon />}
                    label={`${data.kpis.pendingPermitApprovals} pending approval`}
                    color="warning"
                    size="small"
                  />
                )}
                <Button size="small" onClick={() => navigate('/safety/permits')}>View All</Button>
              </Stack>
            </Stack>
            
            <Grid container spacing={2}>
              {data.activePermits.map((permit) => (
                <Grid item xs={12} sm={6} key={permit.id}>
                  <Card variant="outlined" sx={{ bgcolor: alpha('#4caf50', 0.05) }}>
                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ bgcolor: permit.type === 'LOTO' ? 'warning.light' : 'error.light', width: 40, height: 40 }}>
                          {getPermitIcon(permit.type)}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="subtitle2" noWrap>{permit.id}</Typography>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {permit.type === 'LOTO' ? permit.equipment : permit.location}
                          </Typography>
                          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.5 }}>
                            <ClockIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              Valid until {permit.validUntil}
                            </Typography>
                          </Stack>
                        </Box>
                        <Chip label={permit.status} size="small" color="success" />
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              {data.activePermits.length === 0 && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    No active permits at this time
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>

          {/* Recent Incidents */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <IncidentIcon color="warning" />
                <Typography variant="h6">Recent Incidents</Typography>
              </Stack>
              <Button size="small" onClick={() => navigate('/safety/incidents')}>View All</Button>
            </Stack>
            
            <List sx={{ py: 0 }}>
              {data.recentIncidents.map((incident, index) => (
                <Box key={incident.id}>
                  {index > 0 && <Divider />}
                  <ListItem
                    sx={{ px: 0, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                    onClick={() => navigate(`/safety/incidents/${incident.id}`)}
                  >
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: getSeverityColor(incident.severity) + '.light', width: 36, height: 36 }}>
                        {incident.type === 'NEAR_MISS' ? <AlertIcon fontSize="small" /> : <MedicalIcon fontSize="small" />}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="subtitle2">{incident.id}</Typography>
                          <Chip label={incident.type.replace('_', ' ')} size="small" variant="outlined" />
                        </Stack>
                      }
                      secondary={incident.title}
                    />
                    <ListItemSecondaryAction>
                      <Stack alignItems="flex-end" spacing={0.5}>
                        <Chip label={incident.status.replace('_', ' ')} size="small" color={getStatusColor(incident.status)} />
                        <Typography variant="caption" color="text.secondary">{incident.date}</Typography>
                      </Stack>
                    </ListItemSecondaryAction>
                  </ListItem>
                </Box>
              ))}
            </List>
          </Paper>

          {/* Upcoming Inspections */}
          <Paper sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <InspectionIcon color="info" />
                <Typography variant="h6">Upcoming Inspections</Typography>
              </Stack>
              <Button size="small" onClick={() => navigate('/safety/inspections')}>View All</Button>
            </Stack>
            
            <List sx={{ py: 0 }}>
              {data.upcomingInspections.map((inspection, index) => (
                <Box key={inspection.id}>
                  {index > 0 && <Divider />}
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: 'info.light', width: 36, height: 36 }}>
                        <InspectionIcon fontSize="small" />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={inspection.type.replace(/_/g, ' ')}
                      secondary={`${inspection.equipment} • Assigned to ${inspection.assignee}`}
                    />
                    <ListItemSecondaryAction>
                      <Chip
                        icon={<ScheduleIcon />}
                        label={inspection.dueDate}
                        size="small"
                        variant="outlined"
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                </Box>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Right Column - Alerts & Quick Actions */}
        <Grid item xs={12} md={4}>
          {/* Overdue Items Alert */}
          {data.overdueItems.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <AlertCard
                title="Action Required"
                items={data.overdueItems}
                color="error"
                icon={<CriticalIcon fontSize="small" sx={{ color: 'error.main' }} />}
              />
            </Box>
          )}

          {/* Training Status */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <TrainingIcon color="primary" />
              <Typography variant="h6">Training Status</Typography>
            </Stack>
            
            <Box sx={{ mb: 2 }}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Typography variant="body2">Compliance Rate</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {Math.round((data.trainingStatus.fullyTrained / data.trainingStatus.totalEmployees) * 100)}%
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={(data.trainingStatus.fullyTrained / data.trainingStatus.totalEmployees) * 100}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>

            <Grid container spacing={1}>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'success.light', borderRadius: 1 }}>
                  <Typography variant="h6" color="success.dark">{data.trainingStatus.fullyTrained}</Typography>
                  <Typography variant="caption" color="success.dark">Current</Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'warning.light', borderRadius: 1 }}>
                  <Typography variant="h6" color="warning.dark">{data.trainingStatus.dueWithin30Days}</Typography>
                  <Typography variant="caption" color="warning.dark">Due Soon</Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'error.light', borderRadius: 1 }}>
                  <Typography variant="h6" color="error.dark">{data.trainingStatus.overdue}</Typography>
                  <Typography variant="caption" color="error.dark">Overdue</Typography>
                </Box>
              </Grid>
            </Grid>

            <Button
              fullWidth
              variant="outlined"
              sx={{ mt: 2 }}
              onClick={() => navigate('/safety/training')}
            >
              Manage Training
            </Button>
          </Paper>

          {/* Quick Actions */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Quick Actions</Typography>
            <Stack spacing={1}>
              <Button
                fullWidth
                variant="contained"
                color="error"
                startIcon={<IncidentIcon />}
                onClick={() => navigate('/safety/incidents?new=true')}
              >
                Report Incident
              </Button>
              <Button
                fullWidth
                variant="contained"
                color="warning"
                startIcon={<StopWorkIcon />}
                onClick={() => {/* TODO: Stop work modal */}}
              >
                Issue Stop Work
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<PermitIcon />}
                onClick={() => navigate('/safety/permits?new=true')}
              >
                Request Permit
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<InspectionIcon />}
                onClick={() => navigate('/safety/inspections?new=true')}
              >
                Start Inspection
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ViewIcon />}
                onClick={() => navigate('/safety/observations?new=true')}
              >
                Log Observation
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
