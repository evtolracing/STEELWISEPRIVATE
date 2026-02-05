import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  LinearProgress,
  Divider,
  IconButton,
  Tooltip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from '@mui/material';
import {
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  TrendingUp,
  TrendingDown,
  PlaylistAddCheck,
  Assessment,
  Timeline,
  Build,
  Visibility,
  NotificationImportant,
  Block,
  ShowChart,
  Refresh,
} from '@mui/icons-material';

// Stat Card Component
const MetricCard = ({ title, value, subtitle, trend, trendValue, color, icon: Icon, progress }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        <Avatar sx={{ bgcolor: `${color}.light`, width: 40, height: 40 }}>
          <Icon sx={{ color: `${color}.main` }} />
        </Avatar>
      </Box>
      <Typography variant="h4" sx={{ color: `${color}.main`, fontWeight: 700, mb: 0.5 }}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {subtitle}
        </Typography>
      )}
      {progress !== undefined && (
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ mb: 1, height: 6, borderRadius: 3, bgcolor: `${color}.lighter` }}
          color={color}
        />
      )}
      {trend && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {trend === 'up' ? (
            <TrendingUp fontSize="small" color="success" />
          ) : (
            <TrendingDown fontSize="small" color="error" />
          )}
          <Typography variant="caption" color="text.secondary">
            {trendValue}
          </Typography>
        </Box>
      )}
    </CardContent>
  </Card>
);

// Mock Data
const pendingInspections = [
  { id: 'INS-2026-0124', job: 'JOB-2026-0542', stage: 'First Piece', workCenter: 'LATHE-01', priority: 'High', scheduledTime: '10:30 AM' },
  { id: 'INS-2026-0125', job: 'JOB-2026-0538', stage: 'In-Process', workCenter: 'MILL-02', priority: 'Medium', scheduledTime: '11:00 AM' },
  { id: 'INS-2026-0126', job: 'JOB-2026-0545', stage: 'Final', workCenter: 'GRIND-01', priority: 'High', scheduledTime: '11:30 AM' },
  { id: 'INS-2026-0127', job: 'JOB-2026-0541', stage: 'In-Process', workCenter: 'SAW-01', priority: 'Low', scheduledTime: '2:00 PM' },
];

const spcCharts = [
  { characteristic: 'DIM-001 Outside Diameter', status: 'ALERT', violation: 'Rule 4: 7 points above centerline', workCenter: 'LATHE-01' },
  { characteristic: 'DIM-003 Length', status: 'WARNING', violation: 'Rule 2: Approaching UCL', workCenter: 'SAW-02' },
  { characteristic: 'TEMP-001 Heat Treat', status: 'OK', violation: null, workCenter: 'HT-01' },
  { characteristic: 'HARD-001 Hardness', status: 'OK', violation: null, workCenter: 'HT-01' },
];

const recentNCRs = [
  { id: 'NCR-2026-0142', defect: 'Dimension Out of Spec', severity: 'MAJOR', job: 'JOB-2026-0542', age: '2 hours' },
  { id: 'NCR-2026-0141', defect: 'Surface Scratch', severity: 'MINOR', job: 'JOB-2026-0538', age: '1 day' },
  { id: 'NCR-2026-0140', defect: 'Material Defect', severity: 'CRITICAL', job: 'JOB-2026-0535', age: '2 days' },
];

const activeHolds = [
  { id: 'HOLD-2026-0023', type: 'Job Hold', scope: 'JOB-2026-0535', reason: 'Material defect pending investigation', status: 'Active' },
  { id: 'HOLD-2026-0022', type: 'Material Hold', scope: 'LOT-2026-0456', reason: 'Supplier deviation notice', status: 'Investigating' },
];

const defectPareto = [
  { defect: 'Dimension Out of Spec', count: 12, percentage: 35 },
  { defect: 'Surface Finish', count: 8, percentage: 24 },
  { defect: 'Material Defect', count: 6, percentage: 18 },
  { defect: 'Burrs/Sharp Edges', count: 4, percentage: 12 },
  { defect: 'Wrong Alloy', count: 2, percentage: 6 },
  { defect: 'Other', count: 2, percentage: 5 },
];

const QualityDashboard = () => {
  const [lastRefresh] = useState(new Date().toLocaleTimeString());

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'error';
      case 'Medium': return 'warning';
      case 'Low': return 'info';
      default: return 'default';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL': return 'error';
      case 'MAJOR': return 'warning';
      case 'MINOR': return 'default';
      default: return 'default';
    }
  };

  const getSPCStatusColor = (status) => {
    switch (status) {
      case 'ALERT': return 'error';
      case 'WARNING': return 'warning';
      case 'OK': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Quality Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time production quality monitoring and control
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Last updated: {lastRefresh}
          </Typography>
          <IconButton size="small">
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {/* Alerts */}
      {spcCharts.filter(c => c.status === 'ALERT').length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }} icon={<ShowChart />}>
          <strong>{spcCharts.filter(c => c.status === 'ALERT').length} SPC charts showing control violations</strong> - 
          Rule 4 violations detected, review recommended
        </Alert>
      )}

      {activeHolds.length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }} icon={<Block />}>
          <strong>{activeHolds.length} Active Quality Holds</strong> - 
          Material movement restricted pending disposition
        </Alert>
      )}

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="First Pass Yield"
            value="97.2%"
            subtitle="Above target (95%)"
            trend="up"
            trendValue="+0.5% vs last week"
            color="success"
            icon={CheckCircle}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Open NCRs"
            value="8"
            subtitle="3 pending disposition"
            trend="down"
            trendValue="3 less than yesterday"
            color="warning"
            icon={Warning}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Active Holds"
            value="2"
            subtitle="1 job, 1 material"
            trend="up"
            trendValue="1 new today"
            color="error"
            icon={ErrorIcon}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Inspections Today"
            value="34 / 42"
            subtitle="8 remaining"
            progress={81}
            color="info"
            icon={PlaylistAddCheck}
          />
        </Grid>
      </Grid>

      {/* Secondary Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="SPC Charts Active"
            value="24"
            subtitle="2 with violations"
            color="primary"
            icon={Timeline}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Scrap Rate (MTD)"
            value="0.8%"
            subtitle="Target: < 1.0%"
            trend="down"
            trendValue="-0.2% vs last month"
            color="success"
            icon={Assessment}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Rework Rate (MTD)"
            value="2.1%"
            subtitle="Target: < 3.0%"
            trend="down"
            trendValue="-0.5% vs last month"
            color="success"
            icon={Build}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Avg NCR Age"
            value="1.8 days"
            subtitle="Target: < 3 days"
            color="info"
            icon={NotificationImportant}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Pending Inspections */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                Pending Inspections
              </Typography>
              <Chip label={pendingInspections.length} size="small" color="primary" />
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Inspection ID</TableCell>
                    <TableCell>Stage</TableCell>
                    <TableCell>Work Center</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell align="right">Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingInspections.map((insp) => (
                    <TableRow key={insp.id} hover sx={{ cursor: 'pointer' }}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>{insp.id}</Typography>
                        <Typography variant="caption" color="text.secondary">{insp.job}</Typography>
                      </TableCell>
                      <TableCell>{insp.stage}</TableCell>
                      <TableCell>{insp.workCenter}</TableCell>
                      <TableCell>
                        <Chip label={insp.priority} size="small" color={getPriorityColor(insp.priority)} />
                      </TableCell>
                      <TableCell align="right">{insp.scheduledTime}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button variant="outlined" size="small" fullWidth>
                View All Inspections
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* SPC Chart Status */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                SPC Chart Status
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Chip label="2 Alert" size="small" color="error" variant="outlined" />
                <Chip label="1 Warning" size="small" color="warning" variant="outlined" />
              </Box>
            </Box>
            <List disablePadding>
              {spcCharts.map((chart, index) => (
                <React.Fragment key={chart.characteristic}>
                  <ListItem
                    secondaryAction={
                      <Tooltip title="View Chart">
                        <IconButton size="small">
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                    }
                    sx={{ px: 0 }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: `${getSPCStatusColor(chart.status)}.light`, width: 36, height: 36 }}>
                        <ShowChart sx={{ color: `${getSPCStatusColor(chart.status)}.main`, fontSize: 20 }} />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight={500}>{chart.characteristic}</Typography>
                          <Chip label={chart.status} size="small" color={getSPCStatusColor(chart.status)} />
                        </Box>
                      }
                      secondary={chart.violation || 'Process in control'}
                    />
                  </ListItem>
                  {index < spcCharts.length - 1 && <Divider component="li" />}
                </React.Fragment>
              ))}
            </List>
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button variant="outlined" size="small" fullWidth>
                View All SPC Charts
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Defect Pareto */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Top Defects This Week
            </Typography>
            {defectPareto.map((item, index) => (
              <Box key={item.defect} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">
                    {index + 1}. {item.defect}
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {item.count} ({item.percentage}%)
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={item.percentage}
                  sx={{ height: 8, borderRadius: 4 }}
                  color={index === 0 ? 'error' : index === 1 ? 'warning' : 'primary'}
                />
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* Recent NCRs */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                Recent NCRs
              </Typography>
              <Button size="small" startIcon={<Warning />}>
                Create NCR
              </Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>NCR Number</TableCell>
                    <TableCell>Defect</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>Age</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentNCRs.map((ncr) => (
                    <TableRow key={ncr.id} hover sx={{ cursor: 'pointer' }}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>{ncr.id}</Typography>
                        <Typography variant="caption" color="text.secondary">{ncr.job}</Typography>
                      </TableCell>
                      <TableCell>{ncr.defect}</TableCell>
                      <TableCell>
                        <Chip label={ncr.severity} size="small" color={getSeverityColor(ncr.severity)} />
                      </TableCell>
                      <TableCell>{ncr.age}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Active Holds */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                Active Quality Holds
              </Typography>
              <Button size="small" color="error" startIcon={<Block />}>
                Create Hold
              </Button>
            </Box>
            {activeHolds.length === 0 ? (
              <Alert severity="success">No active quality holds</Alert>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Hold Number</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Scope</TableCell>
                      <TableCell>Reason</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activeHolds.map((hold) => (
                      <TableRow key={hold.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500} color="error.main">{hold.id}</Typography>
                        </TableCell>
                        <TableCell>{hold.type}</TableCell>
                        <TableCell>{hold.scope}</TableCell>
                        <TableCell>{hold.reason}</TableCell>
                        <TableCell>
                          <Chip label={hold.status} size="small" color="error" variant="outlined" />
                        </TableCell>
                        <TableCell align="right">
                          <Button size="small" variant="outlined" color="success">
                            Clear Hold
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default QualityDashboard;
