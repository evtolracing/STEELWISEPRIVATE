import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  Divider,
  Avatar,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Pagination,
  Collapse,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Badge,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  CheckCircle,
  Cancel,
  Pending,
  Warning,
  Gavel,
  Timeline,
  Search,
  FilterList,
  Download,
  Visibility,
  Assessment,
  Compare,
  Person,
  CalendarToday,
  AttachMoney,
  LocalShipping,
  Build,
  Speed,
  Inventory2,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Mock decision log data
const mockDecisions = [
  {
    id: 'DEC-2026-0047',
    timestamp: '2026-02-04T11:30:00Z',
    type: 'RFQ_ACCEPT',
    title: 'Accepted RFQ-2026-089 with Conditions',
    description: 'Accepted 15,000 lbs 4140 Round Bar order from Acme Manufacturing',
    decisionMaker: 'Sarah Chen',
    role: 'VP Sales',
    status: 'EXECUTED',
    scenarioId: 'SCENARIO-001',
    predictedOutcome: {
      margin: '+$18,500',
      capacity: '+7% utilization',
      delivery: '95% on-time probability',
    },
    actualOutcome: {
      margin: '+$17,200',
      capacity: '+6.5% utilization',
      delivery: '100% on-time (delivered Feb 6)',
    },
    variance: {
      margin: '-7%',
      overall: 'BETTER_THAN_EXPECTED',
    },
    conditions: [
      'Cleveland capacity confirmed',
      'Extended ship date by 2 days (approved by customer)',
      'Expedited 4140 raw material (arrived Feb 5)',
    ],
    aiRecommendation: 'ACCEPT_WITH_CONDITIONS',
    aiConfidence: 78,
  },
  {
    id: 'DEC-2026-0046',
    timestamp: '2026-02-03T16:45:00Z',
    type: 'CAPACITY_TRANSFER',
    title: 'Transferred 3 Jobs from Detroit to Cleveland',
    description: 'Moved SAW cutting jobs to reduce Detroit utilization from 97% to 82%',
    decisionMaker: 'Mike Rodriguez',
    role: 'COO',
    status: 'EXECUTED',
    scenarioId: 'SCENARIO-002',
    predictedOutcome: {
      capacity: '-15% Detroit, +15% Cleveland',
      delivery: 'Maintain 96% on-time',
      cost: '+$1,200 freight adjustment',
    },
    actualOutcome: {
      capacity: '-14% Detroit, +14% Cleveland',
      delivery: '97% on-time maintained',
      cost: '+$980 freight',
    },
    variance: {
      cost: '+18% better than expected',
      overall: 'AS_EXPECTED',
    },
    conditions: [],
    aiRecommendation: 'ACCEPT',
    aiConfidence: 92,
  },
  {
    id: 'DEC-2026-0045',
    timestamp: '2026-02-02T09:15:00Z',
    type: 'PRICING_OVERRIDE',
    title: 'Approved Strategic Pricing for Apex Industries',
    description: 'Approved 8% discount on 3-month contract valued at $425K',
    decisionMaker: 'Sarah Chen',
    role: 'VP Sales',
    status: 'EXECUTED',
    scenarioId: null,
    predictedOutcome: {
      margin: '18.5% (vs 22% standard)',
      revenue: '+$425K locked',
      risk: 'Competitor displacement',
    },
    actualOutcome: {
      margin: '19.2% actual',
      revenue: 'First order placed Feb 3',
      risk: 'Customer won from competitor',
    },
    variance: {
      margin: '+4% better margin than predicted',
      overall: 'BETTER_THAN_EXPECTED',
    },
    conditions: [
      '3-month commitment required',
      'Volume guarantee 50,000 lbs/month',
    ],
    aiRecommendation: 'ACCEPT_WITH_CONDITIONS',
    aiConfidence: 71,
  },
  {
    id: 'DEC-2026-0044',
    timestamp: '2026-02-01T14:30:00Z',
    type: 'MAINTENANCE_DEFER',
    title: 'Deferred LAT-03 Maintenance by 1 Week',
    description: 'Postponed scheduled lathe maintenance to complete priority orders',
    decisionMaker: 'Mike Rodriguez',
    role: 'COO',
    status: 'PENDING_OUTCOME',
    scenarioId: 'SCENARIO-003',
    predictedOutcome: {
      capacity: '+40 hours available',
      risk: '15% increased breakdown probability',
      delivery: 'Complete 4 priority orders on time',
    },
    actualOutcome: null,
    variance: null,
    conditions: [
      'Reschedule maintenance by Feb 8',
      'Daily equipment inspection required',
    ],
    aiRecommendation: 'CAUTION',
    aiConfidence: 58,
  },
  {
    id: 'DEC-2026-0043',
    timestamp: '2026-01-31T11:00:00Z',
    type: 'RFQ_REJECT',
    title: 'Declined RFQ-2026-078 - Low Margin',
    description: 'Rejected 8,000 lbs aluminum order due to insufficient margin at quoted price',
    decisionMaker: 'Sarah Chen',
    role: 'VP Sales',
    status: 'CLOSED',
    scenarioId: null,
    predictedOutcome: {
      margin: 'Would be 8% (below 15% threshold)',
      capacity: 'Freed 12 hours for higher-margin work',
    },
    actualOutcome: {
      replacement: 'Slot filled with RFQ-2026-082 at 24% margin',
      revenue: 'Net +$4,200 margin improvement',
    },
    variance: {
      overall: 'BETTER_THAN_EXPECTED',
    },
    conditions: [],
    aiRecommendation: 'REJECT',
    aiConfidence: 88,
  },
];

const decisionTypes = [
  { id: 'ALL', label: 'All Types' },
  { id: 'RFQ_ACCEPT', label: 'RFQ Accept' },
  { id: 'RFQ_REJECT', label: 'RFQ Reject' },
  { id: 'CAPACITY_TRANSFER', label: 'Capacity Transfer' },
  { id: 'PRICING_OVERRIDE', label: 'Pricing Override' },
  { id: 'MAINTENANCE_DEFER', label: 'Maintenance' },
];

const DecisionLog = () => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState('ALL');
  const [expandedId, setExpandedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDecision, setSelectedDecision] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const filteredDecisions = mockDecisions.filter(d => {
    if (selectedType !== 'ALL' && d.type !== selectedType) return false;
    if (searchQuery && !d.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getStatusColor = (status) => {
    const colors = {
      EXECUTED: 'success',
      PENDING_OUTCOME: 'warning',
      CLOSED: 'default',
      REJECTED: 'error',
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'EXECUTED': return <CheckCircle color="success" />;
      case 'PENDING_OUTCOME': return <Pending color="warning" />;
      case 'CLOSED': return <CheckCircle color="action" />;
      default: return <Pending />;
    }
  };

  const getVarianceColor = (variance) => {
    if (!variance) return 'default';
    switch (variance) {
      case 'BETTER_THAN_EXPECTED': return 'success';
      case 'AS_EXPECTED': return 'primary';
      case 'WORSE_THAN_EXPECTED': return 'error';
      default: return 'default';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'RFQ_ACCEPT':
      case 'RFQ_REJECT':
        return <AttachMoney />;
      case 'CAPACITY_TRANSFER':
        return <Speed />;
      case 'PRICING_OVERRIDE':
        return <AttachMoney />;
      case 'MAINTENANCE_DEFER':
        return <Build />;
      default:
        return <Gavel />;
    }
  };

  const handleViewDetails = (decision) => {
    setSelectedDecision(decision);
    setDetailDialogOpen(true);
  };

  // Statistics
  const stats = {
    total: mockDecisions.length,
    executed: mockDecisions.filter(d => d.status === 'EXECUTED').length,
    betterThanExpected: mockDecisions.filter(d => d.variance?.overall === 'BETTER_THAN_EXPECTED').length,
    avgConfidence: Math.round(mockDecisions.reduce((sum, d) => sum + d.aiConfidence, 0) / mockDecisions.length),
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Decision Audit Log
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track executive decisions, predicted outcomes, and actual results
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" onClick={() => navigate('/executive/cockpit')}>
            Back to Cockpit
          </Button>
          <Button variant="outlined" startIcon={<Download />}>
            Export
          </Button>
        </Box>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h3" fontWeight={700} color="primary.main">
              {stats.total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Decisions (30 days)
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h3" fontWeight={700} color="success.main">
              {stats.executed}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Executed
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h3" fontWeight={700} color="success.main">
              {Math.round((stats.betterThanExpected / stats.executed) * 100)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Met or Exceeded Prediction
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h3" fontWeight={700}>
              {stats.avgConfidence}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Avg AI Confidence
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search decisions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <Search color="action" sx={{ mr: 1 }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Decision Type</InputLabel>
              <Select
                value={selectedType}
                label="Decision Type"
                onChange={(e) => setSelectedType(e.target.value)}
              >
                {decisionTypes.map((type) => (
                  <MenuItem key={type.id} value={type.id}>{type.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" size="small" startIcon={<CalendarToday />}>
                Date Range
              </Button>
              <Button variant="outlined" size="small" startIcon={<Person />}>
                Decision Maker
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Decision List */}
      <Paper sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell width={50}></TableCell>
                <TableCell><strong>Decision</strong></TableCell>
                <TableCell><strong>Type</strong></TableCell>
                <TableCell><strong>Decision Maker</strong></TableCell>
                <TableCell><strong>Date</strong></TableCell>
                <TableCell><strong>AI Recommendation</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Outcome</strong></TableCell>
                <TableCell width={50}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDecisions.map((decision) => (
                <React.Fragment key={decision.id}>
                  <TableRow 
                    hover 
                    sx={{ 
                      cursor: 'pointer',
                      bgcolor: expandedId === decision.id ? 'grey.50' : 'white',
                    }}
                    onClick={() => setExpandedId(expandedId === decision.id ? null : decision.id)}
                  >
                    <TableCell>
                      <IconButton size="small">
                        {expandedId === decision.id ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {decision.id}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {decision.title}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        icon={getTypeIcon(decision.type)}
                        label={decision.type.replace(/_/g, ' ')}
                        size="small"
                        sx={{ height: 24 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">{decision.decisionMaker}</Typography>
                        <Typography variant="caption" color="text.secondary">{decision.role}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(decision.timestamp).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(decision.timestamp).toLocaleTimeString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip 
                          label={decision.aiRecommendation}
                          size="small"
                          color={
                            decision.aiRecommendation === 'ACCEPT' ? 'success' :
                            decision.aiRecommendation === 'REJECT' ? 'error' :
                            decision.aiRecommendation === 'CAUTION' ? 'warning' : 'default'
                          }
                          sx={{ height: 20, fontSize: '0.65rem' }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {decision.aiConfidence}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        icon={getStatusIcon(decision.status)}
                        label={decision.status.replace(/_/g, ' ')}
                        size="small"
                        color={getStatusColor(decision.status)}
                        sx={{ height: 24 }}
                      />
                    </TableCell>
                    <TableCell>
                      {decision.variance ? (
                        <Chip 
                          label={decision.variance.overall.replace(/_/g, ' ')}
                          size="small"
                          color={getVarianceColor(decision.variance.overall)}
                          sx={{ height: 20, fontSize: '0.6rem' }}
                        />
                      ) : (
                        <Typography variant="caption" color="text.secondary">Pending</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(decision);
                        }}
                      >
                        <Visibility />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  
                  {/* Expanded Row */}
                  <TableRow>
                    <TableCell colSpan={9} sx={{ py: 0 }}>
                      <Collapse in={expandedId === decision.id}>
                        <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                          <Grid container spacing={3}>
                            <Grid item xs={12} md={4}>
                              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                Description
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {decision.description}
                              </Typography>
                              {decision.conditions.length > 0 && (
                                <Box sx={{ mt: 2 }}>
                                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                    Conditions Applied
                                  </Typography>
                                  <List dense>
                                    {decision.conditions.map((c, idx) => (
                                      <ListItem key={idx} sx={{ py: 0, px: 0 }}>
                                        <ListItemIcon sx={{ minWidth: 24 }}>
                                          <CheckCircle color="success" fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText 
                                          primary={c}
                                          primaryTypographyProps={{ variant: 'caption' }}
                                        />
                                      </ListItem>
                                    ))}
                                  </List>
                                </Box>
                              )}
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                Predicted Outcome
                              </Typography>
                              {Object.entries(decision.predictedOutcome).map(([key, value]) => (
                                <Box key={key} sx={{ mb: 0.5 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    {key.charAt(0).toUpperCase() + key.slice(1)}:
                                  </Typography>
                                  <Typography variant="body2">{value}</Typography>
                                </Box>
                              ))}
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                Actual Outcome
                              </Typography>
                              {decision.actualOutcome ? (
                                Object.entries(decision.actualOutcome).map(([key, value]) => (
                                  <Box key={key} sx={{ mb: 0.5 }}>
                                    <Typography variant="caption" color="text.secondary">
                                      {key.charAt(0).toUpperCase() + key.slice(1)}:
                                    </Typography>
                                    <Typography variant="body2">{value}</Typography>
                                  </Box>
                                ))
                              ) : (
                                <Alert severity="info" sx={{ mt: 1 }}>
                                  Outcome pending - check back after execution
                                </Alert>
                              )}
                            </Grid>
                          </Grid>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
          <Pagination count={3} page={1} />
        </Box>
      </Paper>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
        {selectedDecision && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" fontWeight={700}>
                  {selectedDecision.id}
                </Typography>
                <Chip 
                  label={selectedDecision.status.replace(/_/g, ' ')}
                  color={getStatusColor(selectedDecision.status)}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                {selectedDecision.title}
              </Typography>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="body1">{selectedDecision.description}</Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                      Decision Details
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Person fontSize="small" color="action" />
                      <Typography variant="body2">
                        {selectedDecision.decisionMaker} ({selectedDecision.role})
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <CalendarToday fontSize="small" color="action" />
                      <Typography variant="body2">
                        {new Date(selectedDecision.timestamp).toLocaleString()}
                      </Typography>
                    </Box>
                    {selectedDecision.scenarioId && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Timeline fontSize="small" color="action" />
                        <Typography variant="body2">
                          Scenario: {selectedDecision.scenarioId}
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, bgcolor: 'primary.50' }}>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                      AI Analysis
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="body2">Recommendation:</Typography>
                      <Chip 
                        label={selectedDecision.aiRecommendation}
                        size="small"
                        color={
                          selectedDecision.aiRecommendation === 'ACCEPT' ? 'success' :
                          selectedDecision.aiRecommendation === 'REJECT' ? 'error' : 'warning'
                        }
                      />
                    </Box>
                    <Typography variant="body2">
                      Confidence: <strong>{selectedDecision.aiConfidence}%</strong>
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Predicted Outcome
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableBody>
                        {Object.entries(selectedDecision.predictedOutcome).map(([key, value]) => (
                          <TableRow key={key}>
                            <TableCell sx={{ fontWeight: 500 }}>
                              {key.charAt(0).toUpperCase() + key.slice(1)}
                            </TableCell>
                            <TableCell>{value}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Actual Outcome
                  </Typography>
                  {selectedDecision.actualOutcome ? (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableBody>
                          {Object.entries(selectedDecision.actualOutcome).map(([key, value]) => (
                            <TableRow key={key}>
                              <TableCell sx={{ fontWeight: 500 }}>
                                {key.charAt(0).toUpperCase() + key.slice(1)}
                              </TableCell>
                              <TableCell>{value}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Alert severity="info">Outcome pending</Alert>
                  )}
                </Grid>

                {selectedDecision.variance && (
                  <Grid item xs={12}>
                    <Alert 
                      severity={
                        selectedDecision.variance.overall === 'BETTER_THAN_EXPECTED' ? 'success' :
                        selectedDecision.variance.overall === 'AS_EXPECTED' ? 'info' : 'warning'
                      }
                    >
                      <Typography variant="subtitle2" fontWeight={600}>
                        Variance Analysis: {selectedDecision.variance.overall.replace(/_/g, ' ')}
                      </Typography>
                      {Object.entries(selectedDecision.variance)
                        .filter(([key]) => key !== 'overall')
                        .map(([key, value]) => (
                          <Typography key={key} variant="body2">
                            {key.charAt(0).toUpperCase() + key.slice(1)}: {value}
                          </Typography>
                        ))
                      }
                    </Alert>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
              <Button variant="outlined" startIcon={<Compare />}>
                Compare to Similar
              </Button>
              <Button variant="contained" startIcon={<Assessment />}>
                Generate Report
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default DecisionLog;
