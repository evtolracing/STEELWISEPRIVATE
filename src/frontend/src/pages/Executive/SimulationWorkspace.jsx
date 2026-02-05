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
  Divider,
  Avatar,
  LinearProgress,
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
  Stepper,
  Step,
  StepLabel,
  Slider,
  Alert,
  Collapse,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Add,
  Remove,
  PlayArrow,
  Save,
  Compare,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Warning,
  CheckCircle,
  Error,
  ExpandMore,
  Delete,
  ContentCopy,
  Refresh,
  Timeline,
  Speed,
  AttachMoney,
  LocalShipping,
  Build,
  Inventory2,
  Factory,
  ArrowForward,
  Info,
  Lightbulb,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Simulation change types
const changeTypes = [
  { id: 'DEMAND', label: 'Demand Change', icon: <TrendingUp />, description: 'Add/remove orders or change volumes' },
  { id: 'PRICING', label: 'Pricing Change', icon: <AttachMoney />, description: 'Adjust pricing or discount levels' },
  { id: 'CAPACITY', label: 'Capacity Change', icon: <Speed />, description: 'Add shifts, maintenance, or equipment changes' },
  { id: 'MAINTENANCE', label: 'Maintenance Event', icon: <Build />, description: 'Schedule or defer maintenance' },
  { id: 'LOGISTICS', label: 'Logistics Change', icon: <LocalShipping />, description: 'Carrier changes or route optimization' },
  { id: 'INVENTORY', label: 'Inventory Change', icon: <Inventory2 />, description: 'Stock level adjustments or transfers' },
];

// Mock scenarios
const mockScenarios = [
  {
    id: 'SCENARIO-001',
    name: 'Accept RFQ-2026-089',
    status: 'READY',
    changes: [
      { type: 'DEMAND', description: 'Add 15,000 lbs 4140 Round Bar order', value: '+15000 lbs' },
    ],
    createdAt: '2026-02-04T10:30:00Z',
  },
  {
    id: 'SCENARIO-002',
    name: 'Transfer Detroit Jobs to Cleveland',
    status: 'READY',
    changes: [
      { type: 'CAPACITY', description: 'Move 3 jobs from Detroit SAW-01', value: '-18 hrs DET' },
      { type: 'CAPACITY', description: 'Add load to Cleveland SAW-02', value: '+18 hrs CLE' },
    ],
    createdAt: '2026-02-04T09:15:00Z',
  },
  {
    id: 'SCENARIO-003',
    name: 'Defer Lathe Maintenance 2 Weeks',
    status: 'READY',
    changes: [
      { type: 'MAINTENANCE', description: 'Defer LAT-03 maintenance', value: '+14 days' },
      { type: 'CAPACITY', description: 'Potential reliability impact', value: '-5% eff' },
    ],
    createdAt: '2026-02-04T08:00:00Z',
  },
];

// Mock simulation result
const mockSimulationResult = {
  baseline: {
    onTimeDelivery: 96,
    grossMargin: 22.1,
    backlogDays: 12.5,
    utilization: 78,
    riskScore: 62,
    cashPosition: 1250000,
  },
  simulated: {
    onTimeDelivery: 93,
    grossMargin: 23.4,
    backlogDays: 14.2,
    utilization: 85,
    riskScore: 68,
    cashPosition: 1310000,
  },
  impacts: [
    { metric: 'Gross Margin', baseline: '22.1%', simulated: '23.4%', delta: '+1.3%', status: 'positive' },
    { metric: 'On-Time Delivery', baseline: '96%', simulated: '93%', delta: '-3%', status: 'negative' },
    { metric: 'Capacity Utilization', baseline: '78%', simulated: '85%', delta: '+7%', status: 'warning' },
    { metric: 'Backlog Days', baseline: '12.5', simulated: '14.2', delta: '+1.7', status: 'neutral' },
    { metric: 'Risk Score', baseline: '62', simulated: '68', delta: '+6', status: 'negative' },
    { metric: 'Cash Position', baseline: '$1.25M', simulated: '$1.31M', delta: '+$60K', status: 'positive' },
  ],
  recommendation: {
    decision: 'ACCEPT_WITH_CONDITIONS',
    confidence: 78,
    rationale: 'Order improves margin but creates capacity risk. Recommend accepting if Cleveland can absorb overflow.',
    conditions: [
      'Confirm Cleveland has 18 hours available capacity',
      'Negotiate 2-day ship date extension with customer',
      'Expedite 4140 raw material order',
    ],
    risks: [
      { description: 'Detroit may exceed 95% utilization', probability: 65, impact: 'HIGH' },
      { description: 'Potential OT costs if schedule slips', probability: 40, impact: 'MEDIUM' },
    ],
  },
  assumptions: [
    { category: 'Demand', assumption: 'No other RFQs accepted this week', sensitivity: 'HIGH' },
    { category: 'Capacity', assumption: 'SAW-01 runs at rated speed', sensitivity: 'MEDIUM' },
    { category: 'Logistics', assumption: 'Standard carrier rates apply', sensitivity: 'LOW' },
    { category: 'Material', assumption: '4140 arrives by Feb 6', sensitivity: 'HIGH' },
  ],
};

const SimulationWorkspace = () => {
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState(mockScenarios);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [simulationResult, setSimulationResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  
  // New scenario dialog
  const [newScenarioOpen, setNewScenarioOpen] = useState(false);
  const [newScenario, setNewScenario] = useState({
    name: '',
    changes: [],
  });
  
  // Add change dialog
  const [addChangeOpen, setAddChangeOpen] = useState(false);
  const [newChange, setNewChange] = useState({
    type: '',
    description: '',
    value: '',
  });

  const steps = ['Define Scenario', 'Configure Changes', 'Run Simulation', 'Review Results'];

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setActiveStep(2);
    
    setTimeout(() => {
      setSimulationResult(mockSimulationResult);
      setIsSimulating(false);
      setActiveStep(3);
    }, 3000);
  };

  const handleAddChange = () => {
    if (newChange.type && newChange.description) {
      setNewScenario({
        ...newScenario,
        changes: [...newScenario.changes, { ...newChange }],
      });
      setNewChange({ type: '', description: '', value: '' });
      setAddChangeOpen(false);
    }
  };

  const handleSaveScenario = () => {
    const scenario = {
      id: `SCENARIO-${Date.now()}`,
      name: newScenario.name,
      status: 'READY',
      changes: newScenario.changes,
      createdAt: new Date().toISOString(),
    };
    setScenarios([scenario, ...scenarios]);
    setNewScenarioOpen(false);
    setNewScenario({ name: '', changes: [] });
    setSelectedScenario(scenario);
    setActiveStep(1);
  };

  const getStatusColor = (status) => {
    const colors = {
      positive: 'success',
      negative: 'error',
      warning: 'warning',
      neutral: 'default',
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'positive': return <TrendingUp color="success" fontSize="small" />;
      case 'negative': return <TrendingDown color="error" fontSize="small" />;
      case 'warning': return <Warning color="warning" fontSize="small" />;
      default: return <TrendingFlat color="action" fontSize="small" />;
    }
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Simulation Workspace
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Model scenarios and understand impacts before making decisions
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={<Compare />}
            onClick={() => navigate('/executive/cockpit')}
          >
            Back to Cockpit
          </Button>
          <Button 
            variant="contained" 
            startIcon={<Add />}
            onClick={() => setNewScenarioOpen(true)}
          >
            New Scenario
          </Button>
        </Box>
      </Paper>

      {/* Stepper */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stepper activeStep={activeStep}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      <Grid container spacing={3}>
        {/* Scenarios List */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Saved Scenarios
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {scenarios.map((scenario) => (
              <Paper
                key={scenario.id}
                sx={{
                  p: 2,
                  mb: 2,
                  cursor: 'pointer',
                  bgcolor: selectedScenario?.id === scenario.id ? 'primary.50' : 'white',
                  border: selectedScenario?.id === scenario.id ? 2 : 1,
                  borderColor: selectedScenario?.id === scenario.id ? 'primary.main' : 'grey.200',
                  transition: 'all 0.2s',
                  '&:hover': { borderColor: 'primary.main' },
                }}
                onClick={() => {
                  setSelectedScenario(scenario);
                  setActiveStep(1);
                  setSimulationResult(null);
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {scenario.name}
                  </Typography>
                  <Chip 
                    label={scenario.status} 
                    size="small" 
                    color={scenario.status === 'READY' ? 'success' : 'default'}
                    sx={{ height: 20, fontSize: '0.65rem' }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                  {scenario.changes.length} change(s)
                </Typography>
                <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {scenario.changes.slice(0, 2).map((change, idx) => (
                    <Chip 
                      key={idx}
                      label={change.type}
                      size="small"
                      variant="outlined"
                      sx={{ height: 18, fontSize: '0.6rem' }}
                    />
                  ))}
                </Box>
              </Paper>
            ))}
          </Paper>
        </Grid>

        {/* Scenario Details / Simulation */}
        <Grid item xs={12} md={8}>
          {!selectedScenario ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Timeline sx={{ fontSize: 60, color: 'grey.300', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Select a Scenario to Begin
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Choose an existing scenario or create a new one to model impacts
              </Typography>
              <Button 
                variant="contained" 
                sx={{ mt: 3 }}
                onClick={() => setNewScenarioOpen(true)}
              >
                Create New Scenario
              </Button>
            </Paper>
          ) : (
            <>
              {/* Scenario Configuration */}
              <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      {selectedScenario.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ID: {selectedScenario.id} • Created: {new Date(selectedScenario.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton size="small"><ContentCopy fontSize="small" /></IconButton>
                    <IconButton size="small" color="error"><Delete fontSize="small" /></IconButton>
                  </Box>
                </Box>

                <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 2, mb: 1 }}>
                  Changes in this Scenario:
                </Typography>
                
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Type</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Value</TableCell>
                        <TableCell width={50}></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedScenario.changes.map((change, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Chip label={change.type} size="small" sx={{ height: 22 }} />
                          </TableCell>
                          <TableCell>{change.description}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {change.value}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <IconButton size="small"><Delete fontSize="small" /></IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                  <Button variant="outlined" startIcon={<Add />} size="small">
                    Add Change
                  </Button>
                  <Box sx={{ flexGrow: 1 }} />
                  <Button 
                    variant="contained" 
                    startIcon={<PlayArrow />}
                    onClick={handleRunSimulation}
                    disabled={isSimulating}
                  >
                    {isSimulating ? 'Simulating...' : 'Run Simulation'}
                  </Button>
                </Box>
              </Paper>

              {/* Simulation Progress */}
              {isSimulating && (
                <Paper sx={{ p: 3, mb: 3, textAlign: 'center' }}>
                  <LinearProgress sx={{ mb: 2 }} />
                  <Typography variant="body1" fontWeight={500}>
                    Running Simulation...
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Modeling impacts across production, inventory, and financials
                  </Typography>
                </Paper>
              )}

              {/* Simulation Results */}
              {simulationResult && (
                <>
                  {/* Impact Comparison Table */}
                  <Paper sx={{ p: 2, mb: 3 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Impact Analysis
                    </Typography>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'grey.100' }}>
                            <TableCell><strong>Metric</strong></TableCell>
                            <TableCell align="center"><strong>Current State</strong></TableCell>
                            <TableCell align="center"><strong>Simulated</strong></TableCell>
                            <TableCell align="center"><strong>Delta</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {simulationResult.impacts.map((impact, idx) => (
                            <TableRow key={idx}>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  {getStatusIcon(impact.status)}
                                  {impact.metric}
                                </Box>
                              </TableCell>
                              <TableCell align="center">{impact.baseline}</TableCell>
                              <TableCell align="center">
                                <Typography fontWeight={500}>{impact.simulated}</Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Chip 
                                  label={impact.delta}
                                  size="small"
                                  color={getStatusColor(impact.status)}
                                  sx={{ fontWeight: 600 }}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>

                  {/* Recommendation */}
                  <Paper sx={{ p: 2, mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Lightbulb color="warning" />
                      <Typography variant="h6" fontWeight={600}>
                        AI Recommendation
                      </Typography>
                      <Chip 
                        label={`${simulationResult.recommendation.confidence}% confidence`}
                        size="small"
                        color="primary"
                      />
                    </Box>

                    <Alert 
                      severity={
                        simulationResult.recommendation.decision === 'ACCEPT' ? 'success' :
                        simulationResult.recommendation.decision === 'REJECT' ? 'error' : 'warning'
                      }
                      sx={{ mb: 2 }}
                    >
                      <Typography variant="subtitle2">
                        Decision: {simulationResult.recommendation.decision.replace(/_/g, ' ')}
                      </Typography>
                      <Typography variant="body2">
                        {simulationResult.recommendation.rationale}
                      </Typography>
                    </Alert>

                    {simulationResult.recommendation.conditions.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                          Conditions for Acceptance:
                        </Typography>
                        <List dense>
                          {simulationResult.recommendation.conditions.map((condition, idx) => (
                            <ListItem key={idx} sx={{ py: 0 }}>
                              <ListItemIcon sx={{ minWidth: 32 }}>
                                <CheckCircle color="primary" fontSize="small" />
                              </ListItemIcon>
                              <ListItemText primary={condition} />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}

                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                      Identified Risks:
                    </Typography>
                    <Grid container spacing={2}>
                      {simulationResult.recommendation.risks.map((risk, idx) => (
                        <Grid item xs={6} key={idx}>
                          <Paper 
                            sx={{ 
                              p: 1.5, 
                              bgcolor: risk.impact === 'HIGH' ? 'error.50' : 'warning.50',
                              borderLeft: 3,
                              borderColor: risk.impact === 'HIGH' ? 'error.main' : 'warning.main',
                            }}
                          >
                            <Typography variant="body2">{risk.description}</Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                              <Chip label={`${risk.probability}% likely`} size="small" sx={{ height: 18, fontSize: '0.6rem' }} />
                              <Chip label={risk.impact} size="small" color={risk.impact === 'HIGH' ? 'error' : 'warning'} sx={{ height: 18, fontSize: '0.6rem' }} />
                            </Box>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>

                  {/* Assumptions */}
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Info color="action" />
                        <Typography fontWeight={600}>Simulation Assumptions</Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Category</TableCell>
                              <TableCell>Assumption</TableCell>
                              <TableCell>Sensitivity</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {simulationResult.assumptions.map((assumption, idx) => (
                              <TableRow key={idx}>
                                <TableCell>{assumption.category}</TableCell>
                                <TableCell>{assumption.assumption}</TableCell>
                                <TableCell>
                                  <Chip 
                                    label={assumption.sensitivity}
                                    size="small"
                                    color={
                                      assumption.sensitivity === 'HIGH' ? 'error' :
                                      assumption.sensitivity === 'MEDIUM' ? 'warning' : 'success'
                                    }
                                    sx={{ height: 20, fontSize: '0.65rem' }}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </AccordionDetails>
                  </Accordion>

                  {/* Action Buttons */}
                  <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button variant="outlined" startIcon={<Save />}>
                      Save to Decision Log
                    </Button>
                    <Button 
                      variant="contained" 
                      color="success"
                      startIcon={<CheckCircle />}
                      onClick={() => navigate('/executive/decisions')}
                    >
                      Accept & Execute
                    </Button>
                  </Box>
                </>
              )}
            </>
          )}
        </Grid>
      </Grid>

      {/* New Scenario Dialog */}
      <Dialog open={newScenarioOpen} onClose={() => setNewScenarioOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Scenario</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Scenario Name"
            value={newScenario.name}
            onChange={(e) => setNewScenario({ ...newScenario, name: e.target.value })}
            placeholder="e.g., Accept RFQ-2026-089"
            sx={{ mt: 2, mb: 3 }}
          />

          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Select Changes to Model:
          </Typography>
          <Grid container spacing={2}>
            {changeTypes.map((type) => (
              <Grid item xs={6} md={4} key={type.id}>
                <Paper
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: 'primary.main', boxShadow: 2 },
                    border: 1,
                    borderColor: 'grey.200',
                  }}
                  onClick={() => {
                    setNewChange({ ...newChange, type: type.id });
                    setAddChangeOpen(true);
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Avatar sx={{ bgcolor: 'primary.light', width: 32, height: 32 }}>
                      {type.icon}
                    </Avatar>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {type.label}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {type.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {newScenario.changes.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Added Changes:
              </Typography>
              {newScenario.changes.map((change, idx) => (
                <Chip
                  key={idx}
                  label={`${change.type}: ${change.description}`}
                  onDelete={() => {
                    setNewScenario({
                      ...newScenario,
                      changes: newScenario.changes.filter((_, i) => i !== idx),
                    });
                  }}
                  sx={{ mr: 1, mb: 1 }}
                />
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewScenarioOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSaveScenario}
            disabled={!newScenario.name || newScenario.changes.length === 0}
          >
            Create Scenario
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Change Dialog */}
      <Dialog open={addChangeOpen} onClose={() => setAddChangeOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add {changeTypes.find(t => t.id === newChange.type)?.label}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Description"
            value={newChange.description}
            onChange={(e) => setNewChange({ ...newChange, description: e.target.value })}
            placeholder="e.g., Add 15,000 lbs 4140 order"
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            fullWidth
            label="Value/Impact"
            value={newChange.value}
            onChange={(e) => setNewChange({ ...newChange, value: e.target.value })}
            placeholder="e.g., +15000 lbs"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddChangeOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddChange}>Add Change</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SimulationWorkspace;
