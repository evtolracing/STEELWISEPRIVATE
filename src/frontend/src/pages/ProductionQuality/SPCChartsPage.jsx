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
  TextField,
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  Avatar,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  ShowChart,
  Warning,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Visibility,
  Refresh,
  Settings,
  History,
  NotificationsActive,
  Search,
} from '@mui/icons-material';

// Mock SPC Chart Data
const spcCharts = [
  {
    id: 'SPC-001',
    characteristic: 'DIM-001 Outside Diameter',
    workCenter: 'LATHE-01',
    product: 'Shaft Assembly',
    chartType: 'X-bar/R',
    status: 'ALERT',
    ucl: 2.503,
    lcl: 2.497,
    centerLine: 2.500,
    lastValue: 2.502,
    lastViolation: 'Rule 4: 7 consecutive points above centerline',
    lastViolationTime: '10:30 AM Today',
    cpk: 1.12,
    dataPoints: [
      { subgroup: 1, value: 2.501 },
      { subgroup: 2, value: 2.500 },
      { subgroup: 3, value: 2.502 },
      { subgroup: 4, value: 2.501 },
      { subgroup: 5, value: 2.502 },
      { subgroup: 6, value: 2.503 },
      { subgroup: 7, value: 2.502 },
      { subgroup: 8, value: 2.501 },
      { subgroup: 9, value: 2.501 },
      { subgroup: 10, value: 2.502 },
    ],
  },
  {
    id: 'SPC-002',
    characteristic: 'DIM-003 Length',
    workCenter: 'SAW-02',
    product: 'Bar Stock Cut',
    chartType: 'I-MR',
    status: 'WARNING',
    ucl: 6.012,
    lcl: 5.988,
    centerLine: 6.000,
    lastValue: 6.010,
    lastViolation: 'Rule 2: 2 of 3 points in outer third',
    lastViolationTime: '9:15 AM Today',
    cpk: 0.98,
    dataPoints: [
      { subgroup: 1, value: 6.001 },
      { subgroup: 2, value: 6.003 },
      { subgroup: 3, value: 5.998 },
      { subgroup: 4, value: 6.002 },
      { subgroup: 5, value: 6.008 },
      { subgroup: 6, value: 6.010 },
    ],
  },
  {
    id: 'SPC-003',
    characteristic: 'TEMP-001 Heat Treat Temp',
    workCenter: 'HT-01',
    product: 'All Heat Treated Parts',
    chartType: 'X-bar/S',
    status: 'OK',
    ucl: 1555,
    lcl: 1545,
    centerLine: 1550,
    lastValue: 1551,
    lastViolation: null,
    lastViolationTime: null,
    cpk: 1.67,
    dataPoints: [
      { subgroup: 1, value: 1550 },
      { subgroup: 2, value: 1551 },
      { subgroup: 3, value: 1549 },
      { subgroup: 4, value: 1550 },
      { subgroup: 5, value: 1551 },
    ],
  },
  {
    id: 'SPC-004',
    characteristic: 'HARD-001 Hardness',
    workCenter: 'HT-01',
    product: 'Heat Treated Parts',
    chartType: 'X-bar/R',
    status: 'OK',
    ucl: 62,
    lcl: 58,
    centerLine: 60,
    lastValue: 60.2,
    lastViolation: null,
    lastViolationTime: null,
    cpk: 1.45,
    dataPoints: [
      { subgroup: 1, value: 60.1 },
      { subgroup: 2, value: 59.8 },
      { subgroup: 3, value: 60.0 },
      { subgroup: 4, value: 60.3 },
      { subgroup: 5, value: 60.2 },
    ],
  },
];

const violationHistory = [
  { chart: 'DIM-001 Outside Diameter', rule: 'Rule 4', timestamp: '10:30 AM Today', status: 'Active', acknowledgedBy: null },
  { chart: 'DIM-003 Length', rule: 'Rule 2', timestamp: '9:15 AM Today', status: 'Active', acknowledgedBy: null },
  { chart: 'DIM-002 Width', rule: 'Rule 1', timestamp: 'Yesterday 3:45 PM', status: 'Acknowledged', acknowledgedBy: 'QC-Smith' },
  { chart: 'TEMP-001 Heat Treat', rule: 'Rule 7', timestamp: 'Feb 1, 2:30 PM', status: 'Resolved', acknowledgedBy: 'QC-Johnson' },
];

// Simple SPC Chart Component (simplified visualization)
const SPCChartVisual = ({ chart }) => {
  const minVal = Math.min(...chart.dataPoints.map(d => d.value), chart.lcl);
  const maxVal = Math.max(...chart.dataPoints.map(d => d.value), chart.ucl);
  const range = maxVal - minVal;
  
  const getY = (value) => {
    return 100 - ((value - minVal) / range) * 100;
  };

  return (
    <Box sx={{ height: 200, position: 'relative', bgcolor: '#fafafa', borderRadius: 1, p: 2 }}>
      {/* UCL Line */}
      <Box sx={{ 
        position: 'absolute', 
        left: 40, 
        right: 20, 
        top: `${getY(chart.ucl)}%`,
        height: 2,
        bgcolor: 'error.main',
        opacity: 0.5,
      }}>
        <Typography variant="caption" sx={{ position: 'absolute', left: -35, top: -8, color: 'error.main' }}>
          UCL
        </Typography>
      </Box>
      
      {/* Center Line */}
      <Box sx={{ 
        position: 'absolute', 
        left: 40, 
        right: 20, 
        top: `${getY(chart.centerLine)}%`,
        height: 2,
        bgcolor: 'success.main',
      }}>
        <Typography variant="caption" sx={{ position: 'absolute', left: -30, top: -8, color: 'success.main' }}>
          CL
        </Typography>
      </Box>
      
      {/* LCL Line */}
      <Box sx={{ 
        position: 'absolute', 
        left: 40, 
        right: 20, 
        top: `${getY(chart.lcl)}%`,
        height: 2,
        bgcolor: 'error.main',
        opacity: 0.5,
      }}>
        <Typography variant="caption" sx={{ position: 'absolute', left: -35, top: -8, color: 'error.main' }}>
          LCL
        </Typography>
      </Box>
      
      {/* Data Points */}
      <svg 
        style={{ 
          position: 'absolute', 
          left: 40, 
          right: 20, 
          top: 0, 
          bottom: 0, 
          width: 'calc(100% - 60px)', 
          height: '100%' 
        }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* Line connecting points */}
        <polyline
          fill="none"
          stroke="#1976d2"
          strokeWidth="1"
          points={chart.dataPoints.map((d, i) => 
            `${(i / (chart.dataPoints.length - 1)) * 100},${getY(d.value)}`
          ).join(' ')}
        />
        
        {/* Points */}
        {chart.dataPoints.map((d, i) => (
          <circle
            key={i}
            cx={(i / (chart.dataPoints.length - 1)) * 100}
            cy={getY(d.value)}
            r="2"
            fill={d.value > chart.ucl || d.value < chart.lcl ? '#d32f2f' : '#1976d2'}
          />
        ))}
      </svg>
    </Box>
  );
};

const SPCChartsPage = () => {
  const [tab, setTab] = useState(0);
  const [selectedChart, setSelectedChart] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const getStatusColor = (status) => {
    switch (status) {
      case 'ALERT': return 'error';
      case 'WARNING': return 'warning';
      case 'OK': return 'success';
      default: return 'default';
    }
  };

  const getCpkColor = (cpk) => {
    if (cpk >= 1.33) return 'success';
    if (cpk >= 1.0) return 'warning';
    return 'error';
  };

  const alertCharts = spcCharts.filter(c => c.status === 'ALERT');
  const warningCharts = spcCharts.filter(c => c.status === 'WARNING');
  const okCharts = spcCharts.filter(c => c.status === 'OK');

  const filteredCharts = spcCharts.filter(chart => {
    if (tab === 1 && chart.status !== 'ALERT' && chart.status !== 'WARNING') return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return chart.characteristic.toLowerCase().includes(query) || 
             chart.workCenter.toLowerCase().includes(query);
    }
    return true;
  });

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            SPC Charts
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Statistical Process Control monitoring and analysis
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Settings />}>
            Configure Charts
          </Button>
          <Button variant="outlined" startIcon={<Refresh />}>
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      {alertCharts.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <strong>{alertCharts.length} chart(s) showing control violations</strong> - Immediate attention required
        </Alert>
      )}
      {warningCharts.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <strong>{warningCharts.length} chart(s) showing warning patterns</strong> - Monitor closely
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.light' }}>
                <ShowChart sx={{ color: 'primary.main' }} />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700}>{spcCharts.length}</Typography>
                <Typography variant="body2" color="text.secondary">Active Charts</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'error.light' }}>
                <Warning sx={{ color: 'error.main' }} />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700}>{alertCharts.length}</Typography>
                <Typography variant="body2" color="text.secondary">Violations</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'success.light' }}>
                <CheckCircle sx={{ color: 'success.main' }} />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700}>{okCharts.length}</Typography>
                <Typography variant="body2" color="text.secondary">In Control</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'info.light' }}>
                <TrendingUp sx={{ color: 'info.main' }} />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700}>1.33</Typography>
                <Typography variant="body2" color="text.secondary">Avg Cpk</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)}>
          <Tab label={`All Charts (${spcCharts.length})`} />
          <Tab label={`Violations (${alertCharts.length + warningCharts.length})`} />
          <Tab label="Violation History" />
        </Tabs>
      </Paper>

      {/* Search */}
      {tab !== 2 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search by characteristic, work center..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Paper>
      )}

      {/* Charts Grid */}
      {tab !== 2 && (
        <Grid container spacing={3}>
          {filteredCharts.map((chart) => (
            <Grid item xs={12} md={6} key={chart.id}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  border: chart.status === 'ALERT' ? 2 : chart.status === 'WARNING' ? 1 : 0,
                  borderColor: chart.status === 'ALERT' ? 'error.main' : chart.status === 'WARNING' ? 'warning.main' : 'transparent',
                }}
                onClick={() => setSelectedChart(chart)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" fontWeight={600}>
                        {chart.characteristic}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {chart.workCenter} • {chart.chartType}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip 
                        label={chart.status} 
                        size="small" 
                        color={getStatusColor(chart.status)} 
                      />
                      <Chip 
                        label={`Cpk: ${chart.cpk}`} 
                        size="small" 
                        color={getCpkColor(chart.cpk)}
                        variant="outlined"
                      />
                    </Box>
                  </Box>

                  {chart.lastViolation && (
                    <Alert severity={chart.status === 'ALERT' ? 'error' : 'warning'} sx={{ mb: 2 }}>
                      {chart.lastViolation}
                    </Alert>
                  )}

                  <SPCChartVisual chart={chart} />

                  <Divider sx={{ my: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary">UCL</Typography>
                      <Typography variant="body2" fontWeight={500}>{chart.ucl}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary">Center Line</Typography>
                      <Typography variant="body2" fontWeight={500}>{chart.centerLine}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary">LCL</Typography>
                      <Typography variant="body2" fontWeight={500}>{chart.lcl}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Violation History Tab */}
      {tab === 2 && (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Chart / Characteristic</TableCell>
                  <TableCell>Rule Violated</TableCell>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Acknowledged By</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {violationHistory.map((violation, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>{violation.chart}</Typography>
                    </TableCell>
                    <TableCell>{violation.rule}</TableCell>
                    <TableCell>{violation.timestamp}</TableCell>
                    <TableCell>
                      <Chip 
                        label={violation.status} 
                        size="small" 
                        color={
                          violation.status === 'Active' ? 'error' : 
                          violation.status === 'Acknowledged' ? 'warning' : 'success'
                        }
                      />
                    </TableCell>
                    <TableCell>{violation.acknowledgedBy || '—'}</TableCell>
                    <TableCell align="right">
                      {violation.status === 'Active' && (
                        <Button size="small" variant="outlined" color="warning">
                          Acknowledge
                        </Button>
                      )}
                      <IconButton size="small">
                        <Visibility />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Chart Detail Dialog */}
      <Dialog open={!!selectedChart} onClose={() => setSelectedChart(null)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6">{selectedChart?.characteristic}</Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedChart?.workCenter} • {selectedChart?.chartType}
              </Typography>
            </Box>
            <Chip 
              label={selectedChart?.status} 
              color={getStatusColor(selectedChart?.status)} 
            />
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedChart && (
            <Box>
              {selectedChart.lastViolation && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                  <strong>Current Violation:</strong> {selectedChart.lastViolation}
                  <br />
                  <Typography variant="caption">Detected: {selectedChart.lastViolationTime}</Typography>
                </Alert>
              )}

              <Box sx={{ height: 300, mb: 3 }}>
                <SPCChartVisual chart={selectedChart} />
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">Upper Control Limit (UCL)</Typography>
                    <Typography variant="h5" color="error.main">{selectedChart.ucl}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">Center Line (CL)</Typography>
                    <Typography variant="h5" color="success.main">{selectedChart.centerLine}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">Lower Control Limit (LCL)</Typography>
                    <Typography variant="h5" color="error.main">{selectedChart.lcl}</Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">Process Capability (Cpk)</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <Typography variant="h4" fontWeight={700}>{selectedChart.cpk}</Typography>
                    <Chip 
                      label={selectedChart.cpk >= 1.33 ? 'Capable' : selectedChart.cpk >= 1.0 ? 'Marginal' : 'Not Capable'} 
                      size="small"
                      color={getCpkColor(selectedChart.cpk)}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">Last Value</Typography>
                  <Typography variant="h4" fontWeight={700}>{selectedChart.lastValue}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">Data Points</Typography>
                  <Typography variant="h4" fontWeight={700}>{selectedChart.dataPoints.length}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" startIcon={<History />}>View History</Button>
          <Button variant="outlined" startIcon={<Refresh />}>Recalculate Limits</Button>
          {selectedChart?.status !== 'OK' && (
            <Button variant="contained" color="warning" startIcon={<NotificationsActive />}>
              Acknowledge Violation
            </Button>
          )}
          <Button onClick={() => setSelectedChart(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SPCChartsPage;
