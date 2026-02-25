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
  LinearProgress,
  Divider,
  FormControlLabel,
  Checkbox,
  Tooltip,
  Avatar,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  CameraAlt,
  History,
  Save,
  Send,
  Warning,
  Search,
  PlayArrow,
  Visibility,
  Timer,
  Assignment,
  Person,
  Build,
  Add,
} from '@mui/icons-material';

// Mock Data
const pendingInspections = [
  { 
    id: 'INS-2026-0124', 
    job: 'JOB-2026-0542', 
    stage: 'FIRST_PIECE', 
    workCenter: 'LATHE-01', 
    product: 'Shaft Assembly - 2.5" OD x 6"', 
    priority: 'High',
    characteristics: 5,
    criticalCount: 2,
    scheduledTime: '10:30 AM',
    operator: 'John Smith',
  },
  { 
    id: 'INS-2026-0125', 
    job: 'JOB-2026-0538', 
    stage: 'IN_PROCESS', 
    workCenter: 'MILL-02', 
    product: 'Flange Plate - 8" x 8"',
    priority: 'Medium',
    characteristics: 8,
    criticalCount: 3,
    scheduledTime: '11:00 AM',
    operator: 'Mike Johnson',
  },
  { 
    id: 'INS-2026-0126', 
    job: 'JOB-2026-0545', 
    stage: 'FINAL', 
    workCenter: 'GRIND-01', 
    product: 'Precision Bushing - Grade A',
    priority: 'High',
    characteristics: 12,
    criticalCount: 5,
    scheduledTime: '11:30 AM',
    operator: 'Sarah Williams',
  },
  { 
    id: 'INS-2026-0127', 
    job: 'JOB-2026-0541', 
    stage: 'IN_PROCESS', 
    workCenter: 'SAW-01', 
    product: 'Bar Stock Cut - 4130',
    priority: 'Low',
    characteristics: 3,
    criticalCount: 1,
    scheduledTime: '2:00 PM',
    operator: 'Tom Davis',
  },
];

const completedInspections = [
  { id: 'INS-2026-0123', job: 'JOB-2026-0540', stage: 'FINAL', result: 'PASS', completedAt: '9:45 AM', inspector: 'QC-Smith' },
  { id: 'INS-2026-0122', job: 'JOB-2026-0539', stage: 'IN_PROCESS', result: 'PASS', completedAt: '9:15 AM', inspector: 'QC-Smith' },
  { id: 'INS-2026-0121', job: 'JOB-2026-0537', stage: 'FIRST_PIECE', result: 'FAIL', completedAt: '8:30 AM', inspector: 'QC-Johnson' },
];

const characteristicsToInspect = [
  { code: 'DIM-001', name: 'Outside Diameter', type: 'VARIABLE', nominal: 2.500, lower: 2.498, upper: 2.502, unit: 'in', isCritical: true },
  { code: 'DIM-002', name: 'Length', type: 'VARIABLE', nominal: 6.000, lower: 5.990, upper: 6.010, unit: 'in', isCritical: false },
  { code: 'DIM-003', name: 'Inside Diameter', type: 'VARIABLE', nominal: 1.250, lower: 1.248, upper: 1.252, unit: 'in', isCritical: true },
  { code: 'VIS-001', name: 'Surface Finish', type: 'ATTRIBUTE', criteria: 'No visible scratches or tool marks', isCritical: false },
  { code: 'VIS-002', name: 'Burr Check', type: 'ATTRIBUTE', criteria: 'No sharp edges or burrs', isCritical: false },
];

const InspectionExecution = () => {
  const [tab, setTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [measurements, setMeasurements] = useState({});
  const [notes, setNotes] = useState('');
  const [showNCRDialog, setShowNCRDialog] = useState(false);

  const getStageLabel = (stage) => {
    switch (stage) {
      case 'FIRST_PIECE': return 'First Piece';
      case 'IN_PROCESS': return 'In-Process';
      case 'FINAL': return 'Final';
      case 'INCOMING': return 'Incoming';
      default: return stage;
    }
  };

  const getStageColor = (stage) => {
    switch (stage) {
      case 'FIRST_PIECE': return 'info';
      case 'IN_PROCESS': return 'warning';
      case 'FINAL': return 'success';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'error';
      case 'Medium': return 'warning';
      case 'Low': return 'info';
      default: return 'default';
    }
  };

  const evaluateMeasurement = (char, value) => {
    if (value === '' || value === null || value === undefined) return null;
    if (char.type === 'ATTRIBUTE') {
      return value === true ? 'PASS' : 'FAIL';
    }
    const numVal = parseFloat(value);
    if (isNaN(numVal)) return null;
    if (numVal < char.lower || numVal > char.upper) return 'FAIL';
    if (numVal <= char.lower + (char.upper - char.lower) * 0.1 || 
        numVal >= char.upper - (char.upper - char.lower) * 0.1) return 'MARGINAL';
    return 'PASS';
  };

  const handleMeasurementChange = (code, value) => {
    setMeasurements(prev => ({ ...prev, [code]: value }));
  };

  const getResultColor = (result) => {
    if (result === 'PASS') return 'success.light';
    if (result === 'FAIL') return 'error.light';
    if (result === 'MARGINAL') return 'warning.light';
    return 'inherit';
  };

  const handleSubmitInspection = () => {
    const failedCount = characteristicsToInspect.filter(char => 
      evaluateMeasurement(char, measurements[char.code]) === 'FAIL'
    ).length;
    
    if (failedCount > 0) {
      setShowNCRDialog(true);
    } else {
      // Submit as passed
      alert('Inspection submitted successfully!');
      setSelectedInspection(null);
      setMeasurements({});
    }
  };

  const completedCount = Object.keys(measurements).filter(key => 
    measurements[key] !== '' && measurements[key] !== null && measurements[key] !== undefined
  ).length;

  const failedCount = characteristicsToInspect.filter(char => 
    evaluateMeasurement(char, measurements[char.code]) === 'FAIL'
  ).length;

  // Inspection Execution View
  if (selectedInspection) {
    return (
      <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              {getStageLabel(selectedInspection.stage)} Inspection
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedInspection.id} • {selectedInspection.job}
            </Typography>
          </Box>
          <Button variant="outlined" onClick={() => setSelectedInspection(null)}>
            Back to List
          </Button>
        </Box>

        {/* Job Info Card */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary">Job Number</Typography>
              <Typography variant="h6" fontWeight={600}>{selectedInspection.job}</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary">Product</Typography>
              <Typography variant="body1">{selectedInspection.product}</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary">Work Center</Typography>
              <Typography variant="body1">{selectedInspection.workCenter}</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary">Operator</Typography>
              <Typography variant="body1">{selectedInspection.operator}</Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Progress Alert */}
        <Alert 
          severity={failedCount > 0 ? 'error' : completedCount === characteristicsToInspect.length ? 'success' : 'info'} 
          sx={{ mb: 3 }}
        >
          <strong>{completedCount} of {characteristicsToInspect.length}</strong> characteristics inspected
          {failedCount > 0 && <span> • <strong style={{ color: 'red' }}>{failedCount} FAILED</strong></span>}
          {selectedInspection.criticalCount > 0 && 
            <span> • {selectedInspection.criticalCount} critical dimensions require 100% inspection</span>
          }
        </Alert>

        {/* Measurement Cards */}
        {characteristicsToInspect.map((char) => {
          const result = evaluateMeasurement(char, measurements[char.code]);
          return (
            <Card 
              key={char.code}
              sx={{ 
                mb: 2, 
                bgcolor: getResultColor(result),
                border: result === 'FAIL' ? 2 : 0,
                borderColor: 'error.main'
              }}
            >
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {char.code}: {char.name}
                      </Typography>
                      {char.isCritical && (
                        <Chip label="CRITICAL" size="small" color="error" />
                      )}
                    </Box>
                    {char.type === 'VARIABLE' ? (
                      <>
                        <Typography variant="body2" color="text.secondary">
                          Nominal: {char.nominal} {char.unit}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Tolerance: {char.lower} - {char.upper} {char.unit}
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Criteria: {char.criteria}
                      </Typography>
                    )}
                  </Grid>
                  
                  <Grid item xs={12} md={5}>
                    {char.type === 'VARIABLE' ? (
                      <TextField
                        fullWidth
                        label="Measured Value"
                        type="number"
                        value={measurements[char.code] || ''}
                        onChange={(e) => handleMeasurementChange(char.code, e.target.value)}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              {char.unit}
                            </InputAdornment>
                          )
                        }}
                        inputProps={{ step: 0.001 }}
                      />
                    ) : (
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                          variant={measurements[char.code] === true ? 'contained' : 'outlined'}
                          color="success"
                          onClick={() => handleMeasurementChange(char.code, true)}
                          startIcon={<CheckCircle />}
                          fullWidth
                        >
                          Pass
                        </Button>
                        <Button
                          variant={measurements[char.code] === false ? 'contained' : 'outlined'}
                          color="error"
                          onClick={() => handleMeasurementChange(char.code, false)}
                          startIcon={<Cancel />}
                          fullWidth
                        >
                          Fail
                        </Button>
                      </Box>
                    )}
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
                      {result && (
                        <Chip 
                          label={result}
                          color={result === 'PASS' ? 'success' : result === 'FAIL' ? 'error' : 'warning'}
                        />
                      )}
                      <Tooltip title="Attach Photo">
                        <IconButton size="small">
                          <CameraAlt />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View History">
                        <IconButton size="small">
                          <History />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          );
        })}

        {/* Notes */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Inspection Notes"
            placeholder="Add any observations or notes about this inspection..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Paper>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<Save />}>
            Save Draft
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Send />}
            onClick={handleSubmitInspection}
            disabled={completedCount < characteristicsToInspect.length}
          >
            Submit Inspection
          </Button>
        </Box>

        {/* NCR Dialog */}
        <Dialog open={showNCRDialog} onClose={() => setShowNCRDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Warning color="error" />
              Create Nonconformance Report
            </Box>
          </DialogTitle>
          <DialogContent>
            <Alert severity="error" sx={{ mt: 2, mb: 3 }}>
              {failedCount} measurement(s) failed inspection. An NCR is required.
            </Alert>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>Failed Characteristics:</Typography>
                {characteristicsToInspect.filter(char => 
                  evaluateMeasurement(char, measurements[char.code]) === 'FAIL'
                ).map(char => (
                  <Chip 
                    key={char.code}
                    label={`${char.code}: ${char.name}`} 
                    color="error" 
                    sx={{ mr: 1, mb: 1 }} 
                  />
                ))}
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Quantity Affected" type="number" defaultValue={1} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Severity" select defaultValue="MAJOR" SelectProps={{ native: true }}>
                  <option value="MINOR">Minor</option>
                  <option value="MAJOR">Major</option>
                  <option value="CRITICAL">Critical</option>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth multiline rows={3} label="Description" placeholder="Describe the nonconformance..." />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel 
                  control={<Checkbox />} 
                  label="Request immediate containment (notify supervisor)" 
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowNCRDialog(false)}>Cancel</Button>
            <Button variant="contained" color="error" onClick={() => {
              setShowNCRDialog(false);
              alert('NCR created and inspection submitted');
              setSelectedInspection(null);
              setMeasurements({});
            }}>
              Create NCR & Submit
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  // Inspection List View
  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Inspection Execution
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Execute and record quality inspections
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />}>
          Create Ad-Hoc Inspection
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'warning.light' }}>
                <Timer sx={{ color: 'warning.main' }} />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700}>{pendingInspections.length}</Typography>
                <Typography variant="body2" color="text.secondary">Pending</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'info.light' }}>
                <PlayArrow sx={{ color: 'info.main' }} />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700}>2</Typography>
                <Typography variant="body2" color="text.secondary">In Progress</Typography>
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
                <Typography variant="h5" fontWeight={700}>34</Typography>
                <Typography variant="body2" color="text.secondary">Completed Today</Typography>
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
                <Typography variant="h5" fontWeight={700}>2</Typography>
                <Typography variant="body2" color="text.secondary">Failed Today</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)}>
          <Tab label={`Pending (${pendingInspections.length})`} />
          <Tab label="In Progress (2)" />
          <Tab label="Completed (34)" />
        </Tabs>
      </Paper>

      {/* Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search by inspection ID, job, work center..."
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

      {/* Pending Inspections Table */}
      {tab === 0 && (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Inspection ID</TableCell>
                  <TableCell>Stage</TableCell>
                  <TableCell>Product / Job</TableCell>
                  <TableCell>Work Center</TableCell>
                  <TableCell>Characteristics</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Scheduled</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingInspections.map((insp) => (
                  <TableRow key={insp.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{insp.id}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={getStageLabel(insp.stage)} size="small" color={getStageColor(insp.stage)} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{insp.product}</Typography>
                      <Typography variant="caption" color="text.secondary">{insp.job}</Typography>
                    </TableCell>
                    <TableCell>{insp.workCenter}</TableCell>
                    <TableCell>
                      <Typography variant="body2" component="div">
                        {insp.characteristics} total
                        {insp.criticalCount > 0 && (
                          <Chip label={`${insp.criticalCount} critical`} size="small" color="error" sx={{ ml: 1 }} />
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={insp.priority} size="small" color={getPriorityColor(insp.priority)} />
                    </TableCell>
                    <TableCell>{insp.scheduledTime}</TableCell>
                    <TableCell align="right">
                      <Button 
                        variant="contained" 
                        size="small"
                        startIcon={<PlayArrow />}
                        onClick={() => setSelectedInspection(insp)}
                      >
                        Start
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Completed Inspections Table */}
      {tab === 2 && (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Inspection ID</TableCell>
                  <TableCell>Job</TableCell>
                  <TableCell>Stage</TableCell>
                  <TableCell>Result</TableCell>
                  <TableCell>Completed At</TableCell>
                  <TableCell>Inspector</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {completedInspections.map((insp) => (
                  <TableRow key={insp.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{insp.id}</Typography>
                    </TableCell>
                    <TableCell>{insp.job}</TableCell>
                    <TableCell>
                      <Chip label={getStageLabel(insp.stage)} size="small" color={getStageColor(insp.stage)} />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={insp.result} 
                        size="small" 
                        color={insp.result === 'PASS' ? 'success' : 'error'} 
                      />
                    </TableCell>
                    <TableCell>{insp.completedAt}</TableCell>
                    <TableCell>{insp.inspector}</TableCell>
                    <TableCell align="right">
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

      {/* In Progress placeholder */}
      {tab === 1 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">No inspections currently in progress</Typography>
        </Paper>
      )}
    </Box>
  );
};

export default InspectionExecution;
